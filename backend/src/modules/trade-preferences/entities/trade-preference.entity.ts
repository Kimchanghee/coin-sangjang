import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  ExchangeType,
  NetworkMode,
} from '@/modules/exchanges/types/exchange.types';

export type EntryStrategy = 'MARKET' | 'LIMIT';

@Entity('trade_preferences')
export class TradePreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ExchangeType,
    array: true,
    default: [
      ExchangeType.BINANCE,
      ExchangeType.BYBIT,
      ExchangeType.OKX,
      ExchangeType.GATEIO,
      ExchangeType.BITGET,
    ],
  })
  exchanges!: ExchangeType[];

  @Column({ type: 'int', default: 10 })
  leverage!: number;

  @Column({ type: 'float', default: 100 })
  amountUsdt!: number;

  @Column({ type: 'float', default: 15 })
  takeProfitPercent!: number;

  @Column({ type: 'float', default: 5 })
  stopLossPercent!: number;

  @Column({
    type: 'enum',
    enum: NetworkMode,
    default: NetworkMode.TESTNET,
  })
  mode!: NetworkMode;

  @Column({ type: 'boolean', default: true })
  autoTrade!: boolean;

  @Column({
    type: 'enum',
    enum: ['MARKET', 'LIMIT'],
    default: 'MARKET',
  })
  entryType!: EntryStrategy;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
