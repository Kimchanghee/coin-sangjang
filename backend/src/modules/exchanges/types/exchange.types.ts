export enum ExchangeType {
  BINANCE = 'BINANCE',
  BYBIT = 'BYBIT',
  OKX = 'OKX',
  GATE = 'GATE',
  BITGET = 'BITGET',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export interface ExchangeCredentials {
  apiKey: string;
  secretKey: string;
  passphrase?: string;
}

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: string;
  price?: string;
  additionalParams?: Record<string, any>;
}

export interface OrderResponse {
  orderId: string;
  symbol: string;
  status: string;
  executedQty?: string;
  price?: string;
  timestamp: number;
}

export interface ExchangeBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}
