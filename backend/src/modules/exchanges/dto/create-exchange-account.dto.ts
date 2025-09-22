import { Transform, type TransformFnParams } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';
import { UpsertExchangeAccountDto } from './upsert-exchange-account.dto';
import {
  type ExchangeAccountMetadata,
  isExchangeAccountMetadata,
} from '../types/exchange.types';

const normalizeMetadata = ({
  value,
}: TransformFnParams): ExchangeAccountMetadata | undefined =>
  isExchangeAccountMetadata(value) ? value : undefined;

export class CreateExchangeAccountDto extends UpsertExchangeAccountDto {
  @IsOptional()
  @IsObject()
  @Transform(normalizeMetadata, { toClassOnly: true })
  metadata?: ExchangeAccountMetadata;
}

export type { ExchangeAccountMetadata } from '../types/exchange.types';