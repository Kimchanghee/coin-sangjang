import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export const ADMIN_PORTAL_EXCHANGES = [
  'UPBIT',
  'BITHUMB',
  'BINANCE',
  'BYBIT',
  'OKX',
  'GATEIO',
  'BITGET',
] as const;

export type AdminPortalExchangeInput = (typeof ADMIN_PORTAL_EXCHANGES)[number];

export class CreatePortalRequestDto {
  @IsString()
  @Length(3, 64)
  uid!: string;

  @IsIn(ADMIN_PORTAL_EXCHANGES)
  exchange!: AdminPortalExchangeInput;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  memo?: string;
}
