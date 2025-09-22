import { IsIn, IsOptional, IsString } from 'class-validator';

import {
  EXCHANGES,
  type ExchangeSlug,
  type NetworkMode,
} from '../exchange.constants';

export class VerifyExchangeCredentialsDto {
  @IsIn(EXCHANGES)
  exchange!: ExchangeSlug;

  @IsIn(['MAINNET', 'TESTNET'])
  mode!: NetworkMode;

  @IsString()
  apiKeyId!: string;

  @IsString()
  apiKeySecret!: string;

  @IsOptional()
  @IsString()
  passphrase?: string;
}

export interface ExchangeBalanceBreakdownDto {
  type: 'SPOT' | 'FUTURES' | 'MARGIN';
  asset: string;
  total: number;
  available: number;
}

export interface VerifyExchangeCredentialsResponseDto {
  exchange: ExchangeSlug;
  mode: NetworkMode;
  connected: boolean;
  fingerprint: string;
  lastCheckedAt: string;
  balances: ExchangeBalanceBreakdownDto[];
  error?: string;
}
