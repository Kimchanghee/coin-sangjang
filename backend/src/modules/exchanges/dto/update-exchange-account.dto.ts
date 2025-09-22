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

import { ExchangeType, NetworkMode } from '../types/exchange.types';
import type { ExchangeAccountMetadata } from './create-exchange-account.dto';

export class UpdateExchangeAccountDto {
  @IsOptional()
  @IsEnum(ExchangeType)
  exchange?: ExchangeType;

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

export const hasCredentialChanges = (
  dto: Pick<
    UpdateExchangeAccountDto,
    'apiKeyId' | 'apiKeySecret' | 'passphrase'
  >,
): boolean =>
  dto.apiKeyId !== undefined ||
  dto.apiKeySecret !== undefined ||
  dto.passphrase !== undefined;
