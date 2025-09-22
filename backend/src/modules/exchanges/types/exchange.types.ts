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

export const SUPPORTED_EXCHANGES = Object.freeze(
  Object.values(ExchangeType),
) as ReadonlyArray<ExchangeType>;

export const SUPPORTED_NETWORK_MODES = Object.freeze(
  Object.values(NetworkMode),
) as ReadonlyArray<NetworkMode>;

export const resolveNetworkMode = (useTestnet?: boolean): NetworkMode =>
  useTestnet ? NetworkMode.TESTNET : NetworkMode.MAINNET;

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
  mode: NetworkMode;
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
