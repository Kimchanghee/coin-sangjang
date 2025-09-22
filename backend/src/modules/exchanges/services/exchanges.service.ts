import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, createHmac } from 'node:crypto';

import { ExchangeAccount } from '../entities/exchange-account.entity';
import { EXCHANGE_ADAPTERS } from '../adapters/exchange-adapter.token';
import type { ExchangeAdapter } from '../adapters/exchange-adapter.interface';
import { UpsertExchangeAccountDto } from '../dto/upsert-exchange-account.dto';
import {
  VerifyExchangeCredentialsDto,
  type ExchangeBalanceBreakdownDto,
  type VerifyExchangeCredentialsResponseDto,
} from '../dto/verify-exchange-credentials.dto';
import type { ExchangeSlug } from '../exchange.constants';

interface ExchangeAvailabilityDiagnostic {
  exchange: ExchangeSlug;
  available: boolean;
  checkedAt: string;
  error?: string;
}

@Injectable()
export class ExchangesService {
  constructor(
    @InjectRepository(ExchangeAccount)
    private readonly accountsRepository: Repository<ExchangeAccount>,
    @Inject(EXCHANGE_ADAPTERS) private readonly adapters: ExchangeAdapter[],
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
    const useTestnet = options?.useTestnet ?? true;

    const diagnostics = await Promise.all(
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
          return {
            exchange: adapter.exchange,
            available: false,
            checkedAt,
            error: this.formatError(error),
          } satisfies ExchangeAvailabilityDiagnostic;
        }
      }),
    );

    return {
      symbol,
      exchangesReady: diagnostics
        .filter((item) => item.available)
        .map((item) => item.exchange),
      diagnostics,
    };
  }

  async verifyCredentials(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<VerifyExchangeCredentialsResponseDto> {
    const fingerprint = createHash('sha256')
      .update(`${dto.exchange}:${dto.mode}:${dto.apiKeyId}`)
      .digest('hex')
      .slice(0, 16);

    const baseResponse: VerifyExchangeCredentialsResponseDto = {
      exchange: dto.exchange,
      mode: dto.mode,
      connected: false,
      fingerprint,
      lastCheckedAt: new Date().toISOString(),
      balances: [],
    };

    const useTestnet = dto.mode === 'TESTNET';

    try {
      let balances: ExchangeBalanceBreakdownDto[] = [];

      switch (dto.exchange) {
        case 'BINANCE':
          balances = await this.verifyBinance(dto, useTestnet);
          break;
        case 'BYBIT':
          balances = await this.verifyBybit(dto, useTestnet);
          break;
        case 'OKX':
          balances = await this.verifyOkx(dto, useTestnet);
          break;
        case 'GATEIO':
          balances = await this.verifyGateio(dto, useTestnet);
          break;
        case 'BITGET':
          balances = await this.verifyBitget(dto, useTestnet);
          break;
        default:
          throw new Error(`Unsupported exchange ${String(dto.exchange)}`);
      }

      if (balances.length === 0) {
        throw new Error('No balances returned by exchange');
      }

      return {
        ...baseResponse,
        connected: true,
        balances: balances.map((balance) => ({
          ...balance,
          total: this.roundNumber(balance.total),
          available: this.roundNumber(balance.available),
        })),
      };
    } catch (error) {
      return {
        ...baseResponse,
        error: this.formatError(error),
      };
    }
  }

  private async verifyBinance(
    dto: VerifyExchangeCredentialsDto,
    useTestnet: boolean,
  ): Promise<ExchangeBalanceBreakdownDto[]> {
    const balances: ExchangeBalanceBreakdownDto[] = [];

    const headers = {
      'X-MBX-APIKEY': dto.apiKeyId,
    } satisfies Record<string, string>;

    const signQuery = (
      params?: Record<string, string | number | undefined>,
    ) => {
      const search = new URLSearchParams();
      search.set('timestamp', Date.now().toString());
      search.set('recvWindow', '5000');
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            search.set(key, String(value));
          }
        }
      }
      const signature = createHmac('sha256', dto.apiKeySecret)
        .update(search.toString())
        .digest('hex');
      search.set('signature', signature);
      return search.toString();
    };

    const futuresBase = useTestnet
      ? 'https://testnet.binancefuture.com'
      : 'https://fapi.binance.com';
    const spotBase = useTestnet
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';

    const futuresResponse = await fetch(
      `${futuresBase}/fapi/v2/account?${signQuery()}`,
      { headers },
    );

    if (!futuresResponse.ok) {
      const text = await futuresResponse.text();
      throw new Error(
        `Binance futures verification failed (${futuresResponse.status}): ${text || futuresResponse.statusText}`,
      );
    }

    const futuresData = (await futuresResponse.json()) as {
      totalWalletBalance?: string;
      availableBalance?: string;
      assets?: Array<{
        asset: string;
        walletBalance?: string;
        availableBalance?: string;
      }>;
    };

    const futuresAsset = futuresData.assets?.find(
      (asset) => asset.asset === 'USDT',
    );

    const futuresTotal =
      this.parseNumber(futuresData.totalWalletBalance) ||
      this.parseNumber(futuresAsset?.walletBalance);
    const futuresAvailable =
      this.parseNumber(futuresData.availableBalance) ||
      this.parseNumber(futuresAsset?.availableBalance);

    balances.push({
      type: 'FUTURES',
      asset: 'USDT',
      total: futuresTotal,
      available: futuresAvailable,
    });

    try {
      const spotResponse = await fetch(
        `${spotBase}/api/v3/account?${signQuery()}`,
        { headers },
      );
      if (spotResponse.ok) {
        const spotData = (await spotResponse.json()) as {
          balances?: Array<{ asset: string; free?: string; locked?: string }>;
        };
        const spot = spotData.balances?.find((item) => item.asset === 'USDT');
        if (spot) {
          const available = this.parseNumber(spot.free);
          const locked = this.parseNumber(spot.locked);
          balances.push({
            type: 'SPOT',
            asset: 'USDT',
            total: available + locked,
            available,
          });
        }
      }
    } catch (error) {
      // Spot access is optional – ignore failures to avoid masking valid futures credentials.
      if (process.env.NODE_ENV === 'development') {
        console.debug('binance spot verification skipped', error);
      }
    }

    try {
      const marginResponse = await fetch(
        `${spotBase}/sapi/v1/margin/account?${signQuery()}`,
        { headers },
      );
      if (marginResponse.ok) {
        const marginData = (await marginResponse.json()) as {
          totalNetAssetOfUsdt?: string;
          totalAssetOfUsdt?: string;
          availableBalance?: string;
        };
        const total =
          this.parseNumber(marginData.totalNetAssetOfUsdt) ||
          this.parseNumber(marginData.totalAssetOfUsdt);
        const available = this.parseNumber(marginData.availableBalance);
        if (total || available) {
          balances.push({
            type: 'MARGIN',
            asset: 'USDT',
            total,
            available,
          });
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('binance margin verification skipped', error);
      }
    }

    return balances;
  }

  private async verifyBybit(
    dto: VerifyExchangeCredentialsDto,
    useTestnet: boolean,
  ): Promise<ExchangeBalanceBreakdownDto[]> {
    const baseUrl = useTestnet
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com';

    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const query = new URLSearchParams({
      accountType: 'UNIFIED',
      coin: 'USDT',
    }).toString();

    const signature = createHmac('sha256', dto.apiKeySecret)
      .update(`${timestamp}${dto.apiKeyId}${recvWindow}${query}`)
      .digest('hex');

    const response = await fetch(
      `${baseUrl}/v5/account/wallet-balance?${query}`,
      {
        headers: {
          'X-BAPI-API-KEY': dto.apiKeyId,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'X-BAPI-SIGN': signature,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Bybit verification failed (${response.status}): ${text || response.statusText}`,
      );
    }

    const payload = (await response.json()) as {
      retCode?: number;
      retMsg?: string;
      result?: {
        list?: Array<{
          coin?: Array<{
            coin: string;
            equity?: string;
            walletBalance?: string;
            availableToWithdraw?: string;
            availableToTrade?: string;
          }>;
        }>;
      };
    };

    if (payload.retCode !== 0) {
      throw new Error(payload.retMsg || 'Invalid Bybit credentials');
    }

    const coin = payload.result?.list?.[0]?.coin?.find(
      (item) => item.coin === 'USDT',
    );

    if (!coin) {
      return [];
    }

    const total =
      this.parseNumber(coin.equity) || this.parseNumber(coin.walletBalance);
    const available =
      this.parseNumber(coin.availableToWithdraw) ||
      this.parseNumber(coin.availableToTrade);

    return [
      {
        type: 'FUTURES',
        asset: 'USDT',
        total,
        available,
      },
    ];
  }

  private async verifyOkx(
    dto: VerifyExchangeCredentialsDto,
    useTestnet: boolean,
  ): Promise<ExchangeBalanceBreakdownDto[]> {
    if (!dto.passphrase) {
      throw new Error('Passphrase is required for OKX');
    }

    const baseUrl = 'https://www.okx.com';
    const path = '/api/v5/account/balance';
    const query = 'ccy=USDT';
    const method = 'GET';
    const timestamp = (Date.now() / 1000).toFixed(3);

    const signature = createHmac('sha256', dto.apiKeySecret)
      .update(`${timestamp}${method}${path}?${query}`)
      .digest('base64');

    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': dto.apiKeyId,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': dto.passphrase,
    };

    if (useTestnet) {
      headers['x-simulated-trading'] = '1';
    }

    const response = await fetch(`${baseUrl}${path}?${query}`, {
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OKX verification failed (${response.status}): ${text || response.statusText}`,
      );
    }

    const payload = (await response.json()) as {
      code?: string;
      msg?: string;
      data?: Array<{
        totalEq?: string;
        availEq?: string;
        details?: Array<{
          ccy: string;
          eq?: string;
          cashBal?: string;
          availBal?: string;
        }>;
      }>;
    };

    if (payload.code && payload.code !== '0') {
      throw new Error(payload.msg || 'Invalid OKX credentials');
    }

    const account = payload.data?.[0];
    const detail = account?.details?.find((item) => item.ccy === 'USDT');

    const total =
      this.parseNumber(detail?.eq) ||
      this.parseNumber(account?.totalEq) ||
      this.parseNumber(detail?.cashBal);
    const available =
      this.parseNumber(detail?.availBal) || this.parseNumber(account?.availEq);

    return [
      {
        type: 'FUTURES',
        asset: 'USDT',
        total,
        available,
      },
    ];
  }

  private async verifyGateio(
    dto: VerifyExchangeCredentialsDto,
    useTestnet: boolean,
  ): Promise<ExchangeBalanceBreakdownDto[]> {
    const baseUrl = useTestnet
      ? 'https://fx-api-testnet.gateio.ws'
      : 'https://api.gateio.ws';

    const request = async (path: string, query?: string) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const queryString = query ?? '';
      const body = '';
      const signature = createHmac('sha512', dto.apiKeySecret)
        .update([timestamp, 'GET', path, queryString, body].join('\n'))
        .digest('hex');
      const url = `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        headers: {
          KEY: dto.apiKeyId,
          Timestamp: timestamp,
          SIGN: signature,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Gate.io request failed (${response.status}): ${text || response.statusText}`,
        );
      }
      return response.json();
    };

    const balances: ExchangeBalanceBreakdownDto[] = [];

    const futuresData = (await request('/api/v4/futures/usdt/accounts')) as {
      available?: string;
      total?: string;
      balance?: string;
      account?: string;
      availableBalance?: string;
    };

    const futuresTotal =
      this.parseNumber(futuresData.total) ||
      this.parseNumber(futuresData.balance) ||
      this.parseNumber(futuresData.account);
    const futuresAvailable =
      this.parseNumber(futuresData.available) ||
      this.parseNumber(futuresData.availableBalance);

    balances.push({
      type: 'FUTURES',
      asset: 'USDT',
      total: futuresTotal,
      available: futuresAvailable,
    });

    try {
      const spotData = (await request(
        '/api/v4/spot/accounts',
        'currency=USDT',
      )) as
        | Array<{
            currency: string;
            available?: string;
            locked?: string;
            freeze?: string;
          }>
        | {
            currency?: string;
            available?: string;
            locked?: string;
            freeze?: string;
          };

      const spotAccount = Array.isArray(spotData)
        ? spotData.find((item) => item.currency === 'USDT')
        : spotData?.currency === 'USDT'
          ? spotData
          : undefined;

      if (spotAccount) {
        const available = this.parseNumber(
          spotAccount.available ?? spotAccount.freeze,
        );
        const locked = this.parseNumber(spotAccount.locked);
        balances.push({
          type: 'SPOT',
          asset: 'USDT',
          total: available + locked,
          available,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('gateio spot verification skipped', error);
      }
    }

    return balances;
  }

  private async verifyBitget(
    dto: VerifyExchangeCredentialsDto,
    useTestnet: boolean,
  ): Promise<ExchangeBalanceBreakdownDto[]> {
    const { passphrase } = dto;

    if (!passphrase) {
      throw new Error('Passphrase is required for Bitget');
    }

    const baseUrl = useTestnet
      ? 'https://api-testnet.bitget.com'
      : 'https://api.bitget.com';

    const request = async (path: string, query?: string) => {
      const timestamp = Date.now().toString();
      const queryString = query ?? '';
      const signature = createHmac('sha256', dto.apiKeySecret)
        .update(`${timestamp}GET${path}${queryString}`)
        .digest('base64');
      const url = `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
      const headers = {
        'ACCESS-KEY': dto.apiKeyId,
        'ACCESS-SIGN': signature,
        'ACCESS-PASSPHRASE': passphrase,
        'ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      } satisfies Record<string, string>;

      const response = await fetch(url, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Bitget request failed (${response.status}): ${text || response.statusText}`,
        );
      }
      return response.json();
    };

    const balances: ExchangeBalanceBreakdownDto[] = [];

    const futuresData = (await request(
      '/api/mix/v1/account/accounts',
      'productType=umcbl',
    )) as {
      data?: Array<{
        equity?: string;
        usdtEquity?: string;
        availableBalance?: string;
        available?: string;
      }>;
    };

    const futuresAccount = futuresData.data?.[0];

    const futuresTotal =
      this.parseNumber(futuresAccount?.equity) ||
      this.parseNumber(futuresAccount?.usdtEquity);
    const futuresAvailable =
      this.parseNumber(futuresAccount?.availableBalance) ||
      this.parseNumber(futuresAccount?.available);

    balances.push({
      type: 'FUTURES',
      asset: 'USDT',
      total: futuresTotal,
      available: futuresAvailable,
    });

    try {
      const spotData = (await request(
        '/api/spot/v1/account/assets',
        'coin=USDT',
      )) as {
        data?: Array<{
          coin: string;
          available?: string;
          balance?: string;
          frozen?: string;
          locked?: string;
        }>;
      };

      const spotAccount = spotData.data?.find((item) => item.coin === 'USDT');

      if (spotAccount) {
        const available =
          this.parseNumber(spotAccount.available) ||
          this.parseNumber(spotAccount.balance);
        const frozen =
          this.parseNumber(spotAccount.frozen) ||
          this.parseNumber(spotAccount.locked);
        balances.push({
          type: 'SPOT',
          asset: 'USDT',
          total: available + frozen,
          available,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('bitget spot verification skipped', error);
      }
    }

    return balances;
  }

  private parseNumber(value: unknown, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (!normalized) {
        return fallback;
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  private roundNumber(value: number, precision = 2) {
    if (!Number.isFinite(value)) {
      return 0;
    }
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }
}
