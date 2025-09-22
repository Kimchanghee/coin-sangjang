import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  ExchangeType,
  NetworkMode,
  type ExchangeSlug,
} from '../exchange.constants';
import type { ExchangeAccountMetadata } from './create-exchange-account.dto';

export class UpdateExchangeAccountDto {
  @IsOptional()
  @IsEnum(ExchangeType)
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
  @IsEnum(NetworkMode)
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
  metadata?: ExchangeAccountMetadata;
}
