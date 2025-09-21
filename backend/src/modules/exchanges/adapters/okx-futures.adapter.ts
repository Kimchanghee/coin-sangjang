import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ExchangeAdapter } from './exchange-adapter.interface';

@Injectable()
export class OkxFuturesAdapter implements ExchangeAdapter {
  readonly exchange = 'OKX' as const;
  private readonly logger = new Logger(OkxFuturesAdapter.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getEndpoint() {
    return this.config.get<string>('OKX_REST') ?? 'https://www.okx.com';
  }

  private buildInstrumentId(symbol: string) {
    const base = symbol.replace(/USDT$/i, '') || symbol;
    return `${base}-USDT-SWAP`;
  }

  async findSymbol(symbol: string, options: { useTestnet: boolean }) {
    const endpoint = this.getEndpoint();
    const instId = this.buildInstrumentId(symbol);
    try {
      const response = await this.http.axiosRef.get(
        `${endpoint}/api/v5/public/instruments`,
        {
          params: { instType: 'SWAP', instId },
          timeout: 5_000,
          headers: options.useTestnet
            ? { 'x-simulated-trading': '1' }
            : undefined,
        },
      );

      const items: Array<Record<string, any>> = response.data?.data ?? [];
      const available = items.some((item) => {
        const candidate = String(item.instId ?? '').toUpperCase();
        return candidate === instId.toUpperCase();
      });

      if (!available) {
        this.logger.warn(
          { symbol, instId },
          'symbol not listed on OKX swap instruments',
        );
      }

      return available;
    } catch (error) {
      this.logger.error(
        { symbol, instId, err: error },
        'failed to query okx instruments',
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
