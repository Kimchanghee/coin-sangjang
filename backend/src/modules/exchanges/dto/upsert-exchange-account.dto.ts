import {
  IsBoolean,
  IsEnum,
  IsInt,
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

export class UpsertExchangeAccountDto {
  @IsEnum(ExchangeType)
  exchange!: ExchangeSlug;

  @IsString()
  apiKeyId!: string;

  @IsString()
  apiKeySecret!: string;

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
}
