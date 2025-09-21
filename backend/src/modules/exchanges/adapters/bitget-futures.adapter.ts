import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ExchangeAdapter } from './exchange-adapter.interface';

@Injectable()
export class BitgetFuturesAdapter implements ExchangeAdapter {
  readonly exchange = 'BITGET' as const;
  private readonly logger = new Logger(BitgetFuturesAdapter.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getEndpoint(useTestnet: boolean) {
    if (useTestnet) {
      return (
        this.config.get<string>('BITGET_TESTNET_REST') ??
        'https://api.bitget.com'
      );
    }
    return this.config.get<string>('BITGET_REST') ?? 'https://api.bitget.com';
  }

  private buildContractId(symbol: string) {
    const base = symbol.replace(/USDT$/i, '') || symbol;
    return `${base}USDT_UMCBL`;
  }

  async findSymbol(symbol: string, options: { useTestnet: boolean }) {
    const endpoint = this.getEndpoint(options.useTestnet);
    const contractId = this.buildContractId(symbol);
    try {
      const response = await this.http.axiosRef.get(
        `${endpoint}/api/mix/v1/market/contracts`,
        {
          params: { productType: 'umcbl' },
          timeout: 5_000,
        },
      );

      const contracts: Array<Record<string, any>> = response.data?.data ?? [];
      const available = contracts.some((item) => {
        const candidate = String(
          item.symbol ?? item.instId ?? '',
        ).toUpperCase();
        return candidate === contractId.toUpperCase();
      });

      if (!available) {
        this.logger.warn(
          { symbol, contractId },
          'symbol not listed on Bitget USDT perpetuals',
        );
      }

      return available;
    } catch (error) {
      this.logger.error(
        { symbol, contractId, err: error },
        'failed to query bitget contracts',
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
