import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  EXCHANGES,
  type ExchangeSlug,
  type NetworkMode,
} from '../exchange.constants';

export class UpsertExchangeAccountDto {
  @IsIn(EXCHANGES)
  exchange!: ExchangeSlug;

  @IsString()
  apiKeyId!: string;

  @IsString()
  apiKeySecret!: string;

  @IsOptional()
  @IsString()
  passphrase?: string;

  @IsIn(['MAINNET', 'TESTNET'])
  mode!: NetworkMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(125)
  defaultLeverage?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
