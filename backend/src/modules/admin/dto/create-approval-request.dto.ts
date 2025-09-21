import { IsIn, IsString, Length } from 'class-validator';
import { EXCHANGES } from '@/modules/exchanges/exchange.constants';
import type { ExchangeSlug } from '@/modules/exchanges/exchange.constants';

export class CreateApprovalRequestDto {
  @IsString()
  @Length(3, 64)
  uid!: string;

  @IsIn(EXCHANGES)
  exchange!: ExchangeSlug;
}
