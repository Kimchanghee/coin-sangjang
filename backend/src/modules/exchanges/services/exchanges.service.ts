import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, createHmac } from 'node:crypto';

import { ExchangeAccount } from '../entities/exchange-account.entity';
import { EXCHANGE_ADAPTERS } from '../adapters/exchange-adapter.token';
import type { ExchangeAdapter } from '../adapters/exchange-adapter.interface';
import { UpsertExchangeAccountDto } from '../dto/upsert-exchange-account.dto';
import { VerifyExchangeCredentialsDto } from '../dto/verify-exchange-credentials.dto';
import type { ExchangeSlug } from '../exchange.constants';

export interface ExchangeBalanceBreakdown {
  type: 'SPOT' | 'FUTURES' | 'MARGIN';
  asset: string;
  total: number;
  available: number;
}

export interface ExchangeAvailabilityDiagnostic {
  exchange: ExchangeSlug;
  available: boolean;
  checkedAt: string;
  error?: string;
}

@Injectable()
export class ExchangesService {
  private readonly logger = new Logger(ExchangesService.name);

  constructor(
    @InjectRepository(ExchangeAccount)
    private readonly accountsRepository: Repository<ExchangeAccount>,
    @Inject(EXCHANGE_ADAPTERS) private readonly adapters: ExchangeAdapter[],
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  listByUser(userId: string) {
    return this.accountsRepository.find({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertExchangeAccountDto) {
    const existing = await this.accountsRepository.findOne({
      where: { userId, exchange: dto.exchange, mode: dto.mode },
    });

    if (existing) {
      return this.accountsRepository.save({
        ...existing,
        ...dto,
        userId,
      });
    }

    const created = this.accountsRepository.create({
      ...dto,
      userId,
    });
    return this.accountsRepository.save(created);
  }

  async prepareExecution(symbol: string, options?: { useTestnet?: boolean }) {
    const useTestnet = options?.useTestnet ?? false;
    const checks = await Promise.all(
      this.adapters.map(async (adapter) => {
        const checkedAt = new Date().toISOString();
        try {
          const available = await adapter.findSymbol(symbol, { useTestnet });
          return {
            exchange: adapter.exchange,
            available,
            checkedAt,
          } satisfies ExchangeAvailabilityDiagnostic;
        } catch (error) {
          const reason = this.formatError(error);
          this.logger.warn(
            { symbol, exchange: adapter.exchange, err: reason },
            'failed to query exchange availability',
          );
          return {
            exchange: adapter.exchange,
            available: false,
            checkedAt,
            error: reason,
          } satisfies ExchangeAvailabilityDiagnostic;
        }
      }),
    );

    return {
      symbol,
      exchangesReady: checks
        .filter((item) => item.available)
        .map((item) => item.exchange),
      diagnostics: checks,
    };
  }

  async verifyCredentials(dto: VerifyExchangeCredentialsDto) {
    const fingerprint = createHash('sha256')
      .update(`${dto.exchange}:${dto.mode}:${dto.apiKeyId}`)
      .digest('hex')
      .slice(0, 16);

    let balances: ExchangeBalanceBreakdown[] = [];

    switch (dto.exchange) {
      case 'BINANCE':
        balances = await this.verifyBinance(dto);
        break;
      case 'BYBIT':
        balances = await this.verifyBybit(dto);
        break;
      case 'OKX':
        balances = await this.verifyOkx(dto);
        break;
      case 'GATEIO':
        balances = await this.verifyGateio(dto);
        break;
      case 'BITGET':
        balances = await this.verifyBitget(dto);
        break;
      default:
        this.logger.warn(
          { exchange: dto.exchange },
          'verification requested for unsupported exchange',
        );
    }

    return {
      exchange: dto.exchange,
      mode: dto.mode,
      connected: balances.length > 0,
      fingerprint,
      lastCheckedAt: new Date().toISOString(),
      balances,
    };
  }

  private async verifyBinance(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<ExchangeBalanceBreakdown[]> {
    const results: ExchangeBalanceBreakdown[] = [];
    const futuresEndpoint =
      dto.mode === 'TESTNET'
        ? (this.config.get<string>('BINANCE_FUTURES_TESTNET_REST') ??
          'https://testnet.binancefuture.com')
        : (this.config.get<string>('BINANCE_FUTURES_REST') ??
          'https://fapi.binance.com');

    const spotEndpoint =
      dto.mode === 'TESTNET'
        ? (this.config.get<string>('BINANCE_TESTNET_REST') ??
          'https://testnet.binance.vision')
        : (this.config.get<string>('BINANCE_SPOT_REST') ??
          'https://api.binance.com');

    const futures = await this.binanceSignedRequest(
      futuresEndpoint,
      '/fapi/v2/balance',
      dto,
    ).catch((error) => {
      this.logger.error(
        { err: this.formatError(error), exchange: 'BINANCE', scope: 'futures' },
        'failed to query binance futures balance',
      );
      return null;
    });

    if (Array.isArray(futures)) {
      const usdt = futures.find((item: any) => item.asset === 'USDT');
      if (usdt) {
        results.push({
          type: 'FUTURES',
          asset: 'USDT',
          total: this.roundNumber(
            this.parseNumber(usdt.balance ?? usdt.walletBalance),
          ),
          available: this.roundNumber(
            this.parseNumber(usdt.availableBalance ?? usdt.maxWithdrawAmount),
          ),
        });
      }
    }

    const spot = await this.binanceSignedRequest(
      spotEndpoint,
      '/api/v3/account',
      dto,
    ).catch((error) => {
      this.logger.warn(
        { err: this.formatError(error), exchange: 'BINANCE', scope: 'spot' },
        'spot account query failed',
      );
      return null;
    });

    if (spot?.balances) {
      const usdt = (spot.balances as any[]).find(
        (item) => item.asset === 'USDT',
      );
      if (usdt) {
        const free = this.parseNumber(usdt.free);
        const locked = this.parseNumber(usdt.locked);
        results.push({
          type: 'SPOT',
          asset: 'USDT',
          total: this.roundNumber(free + locked),
          available: this.roundNumber(free),
        });
      }
    }

    const margin = await this.binanceSignedRequest(
      spotEndpoint,
      '/sapi/v1/margin/account',
      dto,
    ).catch((error) => {
      this.logger.debug(
        { err: this.formatError(error), exchange: 'BINANCE', scope: 'margin' },
        'margin account unavailable',
      );
      return null;
    });

    if (margin?.userAssets) {
      const usdt = (margin.userAssets as any[]).find(
        (item) => item.asset === 'USDT',
      );
      if (usdt) {
        const total = this.parseNumber(usdt.netAsset ?? usdt.totalAsset);
        const available = this.parseNumber(usdt.free ?? usdt.availableBalance);
        results.push({
          type: 'MARGIN',
          asset: 'USDT',
          total: this.roundNumber(total),
          available: this.roundNumber(available),
        });
      }
    }

    return results;
  }

  private async binanceSignedRequest(
    endpoint: string,
    path: string,
    dto: VerifyExchangeCredentialsDto,
    params: Record<string, string> = {},
  ) {
    const query = new URLSearchParams({
      recvWindow: '5000',
      timestamp: Date.now().toString(),
      ...params,
    });
    const signature = createHmac('sha256', dto.apiKeySecret)
      .update(query.toString())
      .digest('hex');
    const url = `${endpoint}${path}?${query.toString()}&signature=${signature}`;
    const response = await this.http.axiosRef.get(url, {
      headers: { 'X-MBX-APIKEY': dto.apiKeyId },
      timeout: 7_000,
    });
    return response.data;
  }

  private async verifyBybit(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<ExchangeBalanceBreakdown[]> {
    const results: ExchangeBalanceBreakdown[] = [];
    const endpoint =
      dto.mode === 'TESTNET'
        ? (this.config.get<string>('BYBIT_TESTNET_REST') ??
          'https://api-testnet.bybit.com')
        : (this.config.get<string>('BYBIT_REST') ?? 'https://api.bybit.com');

    const unified = await this.bybitSignedRequest(
      endpoint,
      '/v5/account/wallet-balance',
      dto,
      {
        accountType: 'UNIFIED',
      },
    ).catch((error) => {
      this.logger.warn(
        { err: this.formatError(error), exchange: 'BYBIT', scope: 'unified' },
        'failed to query bybit unified balance',
      );
      return null;
    });

    if (unified?.result?.list) {
      const list: any[] = unified.result.list;
      for (const entry of list) {
        if (Array.isArray(entry.coin)) {
          const usdt = entry.coin.find((coin: any) => coin.coin === 'USDT');
          if (usdt) {
            results.push({
              type: 'FUTURES',
              asset: 'USDT',
              total: this.roundNumber(
                this.parseNumber(usdt.equity ?? usdt.walletBalance),
              ),
              available: this.roundNumber(
                this.parseNumber(
                  usdt.availableToWithdraw ?? usdt.availableBalance,
                ),
              ),
            });
            break;
          }
        }
      }
    }

    const spot = await this.bybitSignedRequest(
      endpoint,
      '/v5/account/wallet-balance',
      dto,
      {
        accountType: 'SPOT',
      },
    ).catch((error) => {
      this.logger.debug(
        { err: this.formatError(error), exchange: 'BYBIT', scope: 'spot' },
        'bybit spot balance unavailable',
      );
      return null;
    });

    if (spot?.result?.list) {
      const list: any[] = spot.result.list;
      for (const entry of list) {
        if (Array.isArray(entry.coin)) {
          const usdt = entry.coin.find((coin: any) => coin.coin === 'USDT');
          if (usdt) {
            results.push({
              type: 'SPOT',
              asset: 'USDT',
              total: this.roundNumber(
                this.parseNumber(usdt.walletBalance ?? usdt.equity),
              ),
              available: this.roundNumber(
                this.parseNumber(
                  usdt.availableToWithdraw ?? usdt.availableBalance,
                ),
              ),
            });
            break;
          }
        }
      }
    }

    return results;
  }

  private async bybitSignedRequest(
    endpoint: string,
    path: string,
    dto: VerifyExchangeCredentialsDto,
    query: Record<string, string>,
  ) {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const search = new URLSearchParams(query);
    const queryString = search.toString();
    const preSign = `${timestamp}${dto.apiKeyId}${recvWindow}${queryString}`;
    const signature = createHmac('sha256', dto.apiKeySecret)
      .update(preSign)
      .digest('hex');

    const headers = {
      'X-BAPI-API-KEY': dto.apiKeyId,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN-TYPE': '2',
    } as Record<string, string>;

    const url = `${endpoint}${path}?${queryString}`;
    const response = await this.http.axiosRef.get(url, {
      headers,
      timeout: 7_000,
    });
    return response.data;
  }

  private async verifyOkx(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<ExchangeBalanceBreakdown[]> {
    if (!dto.passphrase) {
      this.logger.warn(
        { exchange: 'OKX' },
        'passphrase required for OKX verification',
      );
      return [];
    }

    const endpoint =
      this.config.get<string>('OKX_REST') ?? 'https://www.okx.com';
    const path = '/api/v5/account/balance';
    const timestamp = new Date().toISOString();
    const prehash = `${timestamp}GET${path}`;
    const signature = createHmac('sha256', dto.apiKeySecret)
      .update(prehash)
      .digest('base64');

    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': dto.apiKeyId,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': dto.passphrase,
    };

    if (dto.mode === 'TESTNET') {
      headers['x-simulated-trading'] = '1';
    }

    const response = await this.http.axiosRef.get(`${endpoint}${path}`, {
      headers,
      timeout: 7_000,
    });

    const data = response.data?.data;
    if (!Array.isArray(data)) {
      return [];
    }

    const balances: ExchangeBalanceBreakdown[] = [];
    for (const account of data) {
      if (!Array.isArray(account.details)) {
        continue;
      }
      const usdt = account.details.find((item: any) => item.ccy === 'USDT');
      if (usdt) {
        balances.push({
          type: 'FUTURES',
          asset: 'USDT',
          total: this.roundNumber(this.parseNumber(usdt.eq ?? usdt.cashBal)),
          available: this.roundNumber(
            this.parseNumber(usdt.availEq ?? usdt.cashBal),
          ),
        });
        break;
      }
    }

    return balances;
  }

  private async verifyGateio(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<ExchangeBalanceBreakdown[]> {
    const endpoint =
      dto.mode === 'TESTNET'
        ? (this.config.get<string>('GATEIO_TESTNET_REST') ??
          'https://fx-api-testnet.gateio.ws')
        : (this.config.get<string>('GATEIO_REST') ?? 'https://api.gateio.ws');

    const path = '/api/v4/futures/usdt/accounts';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hashedBody = createHash('sha512').update('').digest('hex');
    const signaturePayload = `GET\n${path}\n\n${hashedBody}`;
    const signature = createHmac('sha512', dto.apiKeySecret)
      .update(signaturePayload)
      .digest('hex');

    const headers = {
      KEY: dto.apiKeyId,
      Timestamp: timestamp,
      SIGN: signature,
    };

    const response = await this.http.axiosRef.get(`${endpoint}${path}`, {
      headers,
      timeout: 7_000,
    });

    const account = response.data;
    if (!account) {
      return [];
    }

    const total = this.parseNumber(
      account.total ?? account.total_equity ?? account.equity ?? 0,
    );
    const available = this.parseNumber(
      account.available ??
        account.available_margin ??
        account.available_balance ??
        0,
    );

    return [
      {
        type: 'FUTURES',
        asset: 'USDT',
        total: this.roundNumber(total),
        available: this.roundNumber(available),
      },
    ];
  }

  private async verifyBitget(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<ExchangeBalanceBreakdown[]> {
    if (!dto.passphrase) {
      this.logger.warn(
        { exchange: 'BITGET' },
        'passphrase required for Bitget verification',
      );
      return [];
    }

    const endpoint =
      dto.mode === 'TESTNET'
        ? (this.config.get<string>('BITGET_TESTNET_REST') ??
          'https://api.bitget.com')
        : (this.config.get<string>('BITGET_REST') ?? 'https://api.bitget.com');

    const path = '/api/mix/v1/account/accounts';
    const query = 'productType=umcbl';
    const timestamp = new Date().toISOString();
    const prehash = `${timestamp}GET${path}?${query}`;
    const signature = createHmac('sha256', dto.apiKeySecret)
      .update(prehash)
      .digest('base64');

    const headers: Record<string, string> = {
      'ACCESS-KEY': dto.apiKeyId,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': dto.passphrase,
      'Content-Type': 'application/json',
    };

    if (dto.mode === 'TESTNET') {
      headers['X-TESTNET-TYPE'] = '1';
    }

    const response = await this.http.axiosRef.get(
      `${endpoint}${path}?${query}`,
      {
        headers,
        timeout: 7_000,
      },
    );

    const data = response.data?.data;
    if (!Array.isArray(data)) {
      return [];
    }

    const usdt = data.find((item: any) => item.marginCoin === 'USDT');
    if (!usdt) {
      return [];
    }

    return [
      {
        type: 'FUTURES',
        asset: 'USDT',
        total: this.roundNumber(
          this.parseNumber(usdt.equity ?? usdt.totalEquity),
        ),
        available: this.roundNumber(
          this.parseNumber(usdt.available ?? usdt.availableBalance),
        ),
      },
    ];
  }

  private roundNumber(value: number) {
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }

  private parseNumber(value: unknown) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'unknown error';
  }
}
