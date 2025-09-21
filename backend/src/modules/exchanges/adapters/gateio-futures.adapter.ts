import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ExchangeAdapter } from './exchange-adapter.interface';

@Injectable()
export class GateioFuturesAdapter implements ExchangeAdapter {
  readonly exchange = 'GATEIO' as const;
  private readonly logger = new Logger(GateioFuturesAdapter.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getEndpoint(useTestnet: boolean) {
    if (useTestnet) {
      return (
        this.config.get<string>('GATEIO_TESTNET_REST') ??
        'https://fx-api-testnet.gateio.ws'
      );
    }
    return this.config.get<string>('GATEIO_REST') ?? 'https://api.gateio.ws';
  }

  private buildContractId(symbol: string) {
    const base = symbol.replace(/USDT$/i, '') || symbol;
    return `${base}_USDT`;
  }

  async findSymbol(symbol: string, options: { useTestnet: boolean }) {
    const endpoint = this.getEndpoint(options.useTestnet);
    const contractId = this.buildContractId(symbol);
    try {
      const response = await this.http.axiosRef.get(
        `${endpoint}/api/v4/futures/usdt/contracts/${contractId}`,
        {
          timeout: 5_000,
        },
      );

      const contract = response.data ?? {};
      const available = Boolean(contract?.name || contract?.contract);
      if (!available) {
        this.logger.warn(
          { symbol, contractId },
          'symbol not listed on Gate.io USDT futures',
        );
      }

      return available;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }
      this.logger.error(
        { symbol, contractId, err: error },
        'failed to query gateio futures contract',
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
