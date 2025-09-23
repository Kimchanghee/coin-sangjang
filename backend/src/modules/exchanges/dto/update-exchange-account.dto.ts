import { Transform, type TransformFnParams } from 'class-transformer';
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
  type ExchangeAccountMetadata,
  ExchangeType,
  NetworkMode,
  isExchangeAccountMetadata,
} from '../types/exchange.types';

const trimString = ({ value }: TransformFnParams) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeMetadata = ({
  value,
}: TransformFnParams): ExchangeAccountMetadata | undefined =>
  isExchangeAccountMetadata(value) ? value : undefined;

export class UpdateExchangeAccountDto {
  @IsOptional()
  @IsEnum(ExchangeType)
  exchange?: ExchangeType;

  @IsOptional()
  @IsString()
  @Transform(trimString, { toClassOnly: true })
  apiKeyId?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString, { toClassOnly: true })
  apiKeySecret?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString, { toClassOnly: true })
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
  @Transform(normalizeMetadata, { toClassOnly: true })
  metadata?: ExchangeAccountMetadata;

  static hasCredentialChanges(dto: UpdateExchangeAccountDto): boolean {
    return (
      dto.apiKeyId !== undefined ||
      dto.apiKeySecret !== undefined ||
      dto.passphrase !== undefined
    );
  }
}
