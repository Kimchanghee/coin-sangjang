import { IsObject, IsOptional } from 'class-validator';

import { UpsertExchangeAccountDto } from './upsert-exchange-account.dto';

export type ExchangeAccountMetadata = Record<string, unknown>;

export const isExchangeAccountMetadata = (
  value: unknown,
): value is ExchangeAccountMetadata =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class CreateExchangeAccountDto extends UpsertExchangeAccountDto {
  @IsOptional()
  @IsObject()
  metadata?: ExchangeAccountMetadata;
}
