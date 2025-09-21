import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export interface MarketAvailabilitySnapshot {
  exchange: string;
  available: boolean;
  checkedAt: string;
}

@Entity('listing_events')
export class ListingEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 16 })
  source!: 'UPBIT' | 'BITHUMB';

  @Column({ type: 'varchar', length: 32 })
  symbol!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  baseSymbol?: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  marketsSnapshot?: MarketAvailabilitySnapshot[];

  @Column({ type: 'timestamptz' })
  announcedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Column({ default: false })
  processed!: boolean;

  @CreateDateColumn()
  receivedAt!: Date;
}
