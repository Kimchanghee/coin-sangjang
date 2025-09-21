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
