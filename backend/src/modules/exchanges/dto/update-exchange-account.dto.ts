import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  EXCHANGES,
  type ExchangeSlug,
  type NetworkMode,
} from '../exchange.constants';

export class UpdateExchangeAccountDto {
  @IsOptional()
  @IsIn(EXCHANGES)
  exchange?: ExchangeSlug;

  @IsOptional()
  @IsString()
  apiKeyId?: string;

  @IsOptional()
  @IsString()
  apiKeySecret?: string;

  @IsOptional()
  @IsString()
  passphrase?: string;

  @IsOptional()
  @IsIn(['MAINNET', 'TESTNET'])
  mode?: NetworkMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(125)
  defaultLeverage?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
