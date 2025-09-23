export enum ExchangeType {
  BINANCE = 'BINANCE',
  BYBIT = 'BYBIT',
  OKX = 'OKX',
  GATEIO = 'GATEIO',
  BITGET = 'BITGET',
}

export enum NetworkMode {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET',
}

const exchangeValues = Object.values(ExchangeType) as ExchangeType[];
const networkModeValues = Object.values(NetworkMode) as NetworkMode[];

export const SUPPORTED_EXCHANGES = Object.freeze(exchangeValues);
export const SUPPORTED_NETWORK_MODES = Object.freeze(networkModeValues);

const SUPPORTED_EXCHANGE_SET = new Set<ExchangeType>(exchangeValues);
const SUPPORTED_NETWORK_MODE_SET = new Set<NetworkMode>(networkModeValues);

export const DEFAULT_NETWORK_MODE = NetworkMode.MAINNET;

export type ExchangeAccountMetadata = Record<string, unknown>;

export const isExchangeAccountMetadata = (
  value: unknown,
): value is ExchangeAccountMetadata =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSupportedExchange = (value: unknown): value is ExchangeType =>
  typeof value === 'string' &&
  SUPPORTED_EXCHANGE_SET.has(value as ExchangeType);

export const isSupportedNetworkMode = (value: unknown): value is NetworkMode =>
  typeof value === 'string' &&
  SUPPORTED_NETWORK_MODE_SET.has(value as NetworkMode);

export const normalizeExchangeType = (
  value: unknown,
): ExchangeType | undefined => {
  if (isSupportedExchange(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    return isSupportedExchange(normalized) ? normalized : undefined;
  }
  return undefined;
};

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
