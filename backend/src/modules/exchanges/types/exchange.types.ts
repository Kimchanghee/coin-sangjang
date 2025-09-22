import {
  EXCHANGES,
  type ExchangeSlug,
  type NetworkMode,
} from '../exchange.constants';

export type ExchangeType = ExchangeSlug;

export const SUPPORTED_EXCHANGES = Object.freeze([
  ...EXCHANGES,
] as const satisfies ReadonlyArray<ExchangeType>);

export type ExchangeOrderSide = 'BUY' | 'SELL';
export type ExchangeOrderType = 'MARKET' | 'LIMIT';

export interface ExchangeCredentials {
  apiKeyId: string;
  apiKeySecret: string;
  passphrase?: string;
  mode: NetworkMode;
}

export interface OrderRequest {
  symbol: string;
  side: ExchangeOrderSide;
  type: ExchangeOrderType;
  quantity: string;
  price?: string;
  additionalParams?: Record<string, string | number | boolean | undefined>;
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
  checkedAt: string;
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
