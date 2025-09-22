import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { ExchangeType, NetworkMode } from '../types/exchange.types';

export class UpsertExchangeAccountDto {
  @IsEnum(ExchangeType)
  exchange!: ExchangeType;

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
