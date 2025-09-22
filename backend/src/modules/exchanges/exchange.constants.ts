import { ExchangeType, NetworkMode } from './types/exchange.types';

export type ExchangeSlug = ExchangeType;

export const EXCHANGES: ExchangeSlug[] = [
  ExchangeType.BINANCE,
  ExchangeType.BYBIT,
  ExchangeType.OKX,
  ExchangeType.GATEIO,
  ExchangeType.BITGET,
];

export const NETWORK_MODES: NetworkMode[] = [
  NetworkMode.MAINNET,
  NetworkMode.TESTNET,
];

export { ExchangeType, NetworkMode };
