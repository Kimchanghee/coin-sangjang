import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExchangeAccount } from '@/modules/exchanges/entities/exchange-account.entity';
import { ListingEvent } from '@/modules/listings/entities/listing-event.entity';

export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'FAILED';

@Entity('trade_orders')
export class TradeOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ExchangeAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exchange_account_id' })
  exchangeAccount!: ExchangeAccount;

  @Column({ name: 'exchange_account_id' })
  exchangeAccountId!: string;

  @ManyToOne(() => ListingEvent, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'listing_event_id' })
  listingEvent?: ListingEvent;

  @Column({ name: 'listing_event_id', nullable: true })
  listingEventId?: string;

  @Column({ type: 'varchar', length: 32 })
  symbol!: string;

  @Column({ type: 'varchar', length: 8 })
  side!: TradeSide;

  @Column({ type: 'numeric', precision: 18, scale: 8 })
  quantity!: string;

  @Column({ type: 'numeric', precision: 18, scale: 8 })
  notional!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  leverage!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  takeProfitPercent?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  stopLossPercent?: string;

  @Column({ type: 'varchar', length: 12, default: 'PENDING' })
  status!: TradeStatus;

  @Column({ type: 'jsonb', nullable: true })
  exchangeMetadata?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  openedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
