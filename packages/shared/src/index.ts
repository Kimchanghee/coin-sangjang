export interface ListingEventPayload {
  id: string;
  source: 'UPBIT' | 'BITHUMB';
  symbol: string;
  announcedAt: string;
  payload?: Record<string, unknown>;
}

export interface TradePreference {
  exchange: string;
  mode: 'MAINNET' | 'TESTNET';
  leverage: number;
  usdtAmount: number;
  takeProfitPercent: number;
  stopLossPercent: number;
  autoTrade: boolean;
}

export interface ExchangeCredential {
  exchange: string;
  mode: 'MAINNET' | 'TESTNET';
  apiKeyId: string;
  apiKeySecret: string;
  passphrase?: string;
}
