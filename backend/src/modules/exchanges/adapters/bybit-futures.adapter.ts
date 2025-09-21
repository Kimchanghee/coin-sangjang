import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ExchangeAdapter } from './exchange-adapter.interface';

@Injectable()
export class BybitFuturesAdapter implements ExchangeAdapter {
  readonly exchange = 'BYBIT' as const;
  private readonly logger = new Logger(BybitFuturesAdapter.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getEndpoint(useTestnet: boolean) {
    if (useTestnet) {
      return (
        this.config.get<string>('BYBIT_TESTNET_REST') ??
        'https://api-testnet.bybit.com'
      );
    }
    return this.config.get<string>('BYBIT_REST') ?? 'https://api.bybit.com';
  }

  async findSymbol(symbol: string, options: { useTestnet: boolean }) {
    const endpoint = this.getEndpoint(options.useTestnet);
    try {
      const response = await this.http.axiosRef.get(
        `${endpoint}/v5/market/instruments-info`,
        {
          params: { category: 'linear', symbol },
          timeout: 5_000,
        },
      );

      const list: Array<Record<string, any>> =
        response.data?.result?.list ?? response.data?.result?.category ?? [];
      const available = list.some((item) => {
        const candidate = String(
          item.symbol ?? item.contract ?? '',
        ).toUpperCase();
        return candidate === symbol.toUpperCase();
      });

      if (!available) {
        this.logger.warn(
          { symbol, endpoint },
          'symbol not listed on Bybit linear futures',
        );
      }

      return available;
    } catch (error) {
      this.logger.error(
        { symbol, endpoint, err: error },
        'failed to query bybit instruments',
      );
      return false;
    }
  }

  async ensureLeverage(): Promise<void> {
    await Promise.resolve();
  }

  async placeMarketOrder(): Promise<{
    orderId: string;
    clientOrderId?: string;
  }> {
    await Promise.resolve();
    return { orderId: 'stub' };
  }
}
