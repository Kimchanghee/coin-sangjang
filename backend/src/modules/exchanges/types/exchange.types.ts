import { EXCHANGES, type NetworkMode } from '../exchange.constants';

export const EXCHANGE_SYMBOL = {
  BINANCE: 'BINANCE',
  BYBIT: 'BYBIT',
  OKX: 'OKX',
  GATEIO: 'GATEIO',
  BITGET: 'BITGET',
} as const;

export type ExchangeType =
  (typeof EXCHANGE_SYMBOL)[keyof typeof EXCHANGE_SYMBOL];

export const SUPPORTED_EXCHANGES = EXCHANGES as readonly ExchangeType[];

export interface ExchangeCredentials {
  apiKeyId: string;
  apiKeySecret: string;
  passphrase?: string;
  mode: NetworkMode;
}

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: string;
  price?: string;
  additionalParams?: Record<string, unknown>;
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

export interface ExchangeAvailabilityDiagnostic {
  exchange: ExchangeType;
  ready: boolean;
  available: boolean;
  message?: string;
  checkedAt?: string;
  error?: string;
}

export interface PrepareExecutionOptions {
  useTestnet?: boolean;
}

export interface PrepareExecutionResult {
  symbol: string;
  diagnostics: ExchangeAvailabilityDiagnostic[];
  ready: boolean;
  useTestnet: boolean;
}
