import { PartialType } from '@nestjs/mapped-types';
import { CreateExchangeAccountDto } from './create-exchange-account.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export class UpdateExchangeAccountDto extends PartialType(
  CreateExchangeAccountDto,
) {
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
