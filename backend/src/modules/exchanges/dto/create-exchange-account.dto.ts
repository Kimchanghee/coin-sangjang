import { IsObject, IsOptional } from 'class-validator';

import { UpsertExchangeAccountDto } from './upsert-exchange-account.dto';

export type ExchangeAccountMetadata = Record<string, unknown>;

export class CreateExchangeAccountDto extends UpsertExchangeAccountDto {
  @IsOptional()
  @IsObject()
  metadata?: ExchangeAccountMetadata;
}
