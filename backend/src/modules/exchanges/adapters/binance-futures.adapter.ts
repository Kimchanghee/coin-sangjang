import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ExchangeAdapter } from './exchange-adapter.interface';
import { ExchangeType } from '../types/exchange.types';

@Injectable()
export class BinanceFuturesAdapter implements ExchangeAdapter {
  readonly exchange = ExchangeType.BINANCE;
  private readonly logger = new Logger(BinanceFuturesAdapter.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getRestEndpoint(useTestnet: boolean) {
    if (useTestnet) {
      return (
        this.config.get<string>('BINANCE_FUTURES_TESTNET_REST') ??
        'https://testnet.binancefuture.com'
      );
    }
    return (
      this.config.get<string>('BINANCE_FUTURES_REST') ??
      'https://fapi.binance.com'
    );
  }

  async findSymbol(
    symbol: string,
    options: { useTestnet: boolean },
  ): Promise<boolean> {
    const endpoint = this.getRestEndpoint(options.useTestnet);
    try {
      const response = await this.http.axiosRef.get(
        `${endpoint}/fapi/v1/exchangeInfo`,
        {
          params: { symbol },
          timeout: 5_000,
        },
      );
      const symbols: any[] = response.data?.symbols ?? [];
      const match = symbols.some((item) => item.symbol === symbol);
      if (!match) {
        this.logger.warn(
          { symbol, endpoint },
          'symbol not listed on binance futures',
        );
      }
      return match;
    } catch (error) {
      this.logger.error(
        { symbol, endpoint, err: error },
        'failed to query binance exchange info',
      );
      return false;
    }
  }

  async ensureLeverage(params: {
    symbol: string;
    leverage: number;
    apiKeyId: string;
    apiKeySecret: string;
    passphrase?: string;
    useTestnet: boolean;
  }): Promise<void> {
    this.logger.debug(
      { symbol: params.symbol, leverage: params.leverage },
      'ensureLeverage stub invoked',
    );
    // TODO: Implement signed POST /fapi/v1/leverage using API credentials.
    await Promise.resolve();
  }

  async placeMarketOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    leverage: number;
    apiKeyId: string;
    apiKeySecret: string;
    passphrase?: string;
    useTestnet: boolean;
    takeProfitPercent?: number;
    stopLossPercent?: number;
  }): Promise<{ orderId: string; clientOrderId?: string }> {
    this.logger.debug(
      { symbol: params.symbol, side: params.side },
      'placeMarketOrder stub invoked',
    );
    // TODO: Implement signed POST /fapi/v1/order with TP/SL handling.
    await Promise.resolve();
    return { orderId: 'stub' };
  }
}
