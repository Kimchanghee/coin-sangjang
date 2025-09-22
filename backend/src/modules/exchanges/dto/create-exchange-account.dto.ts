import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export enum ExchangeType {
  BINANCE = 'BINANCE',
  BYBIT = 'BYBIT',
  OKX = 'OKX',
  GATE = 'GATE',
  BITGET = 'BITGET',
}

export class CreateExchangeAccountDto {
  @IsEnum(ExchangeType)
  exchange: ExchangeType;

  @IsString()
  apiKey: string;

  @IsString()
  secretKey: string;

  @IsOptional()
  @IsString()
  passphrase?: string;

  @IsOptional()
  @IsBoolean()
  isTestnet?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
