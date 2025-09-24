export interface MarketSnapshot {
  exchange: string;
  available: boolean;
  checkedAt?: string;
  error?: string;
}

export interface ListingEvent {
  id?: string;
  source: string;
  symbol: string;
  baseSymbol?: string;
  announcedAt: string;
  marketsSnapshot?: MarketSnapshot[];
}

export interface ExchangeAvailabilityDiagnostic {
  exchange: string;
  ready: boolean;
  available: boolean;
  message?: string;
  checkedAt: string;
  error?: string;
}

export interface ExecutionPreviewResult {
  symbol: string;
  diagnostics: ExchangeAvailabilityDiagnostic[];
  ready: boolean;
  useTestnet: boolean;
}
