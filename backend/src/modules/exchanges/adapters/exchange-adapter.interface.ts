import type { ExchangeSlug } from '../exchange.constants';

export interface ExchangeAdapter {
  readonly exchange: ExchangeSlug;
  findSymbol(
    symbol: string,
    options: { useTestnet: boolean },
  ): Promise<boolean>;
  ensureLeverage(params: {
    symbol: string;
    leverage: number;
    apiKeyId: string;
    apiKeySecret: string;
    passphrase?: string;
    useTestnet: boolean;
  }): Promise<void>;
  placeMarketOrder(params: {
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
  }): Promise<{ orderId: string; clientOrderId?: string }>;
}
