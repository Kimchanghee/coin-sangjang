import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import {
  ExchangeType,
  NetworkMode,
} from '@/modules/exchanges/types/exchange.types';
import type { EntryStrategy } from '../entities/trade-preference.entity';

export class UpdateTradePreferenceDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ExchangeType, { each: true })
  exchanges!: ExchangeType[];

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(125)
  leverage!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amountUsdt!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  takeProfitPercent!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  stopLossPercent!: number;

  @IsEnum(NetworkMode)
  mode!: NetworkMode;

  @IsBoolean()
  autoTrade!: boolean;

  @IsOptional()
  @IsIn(['MARKET', 'LIMIT'])
  entryType?: EntryStrategy;
}
