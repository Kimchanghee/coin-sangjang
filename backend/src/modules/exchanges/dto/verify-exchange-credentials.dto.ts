import { IsEnum, IsOptional, IsString } from 'class-validator';

import {
  ExchangeType,
  NetworkMode,
  type ExchangeSlug,
} from '../exchange.constants';

export class VerifyExchangeCredentialsDto {
  @IsEnum(ExchangeType)
  exchange!: ExchangeSlug;

  @IsEnum(NetworkMode)
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
