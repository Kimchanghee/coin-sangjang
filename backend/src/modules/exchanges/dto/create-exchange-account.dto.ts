import { IsObject, IsOptional } from 'class-validator';

import { UpsertExchangeAccountDto } from './upsert-exchange-account.dto';

export class CreateExchangeAccountDto extends UpsertExchangeAccountDto {
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
