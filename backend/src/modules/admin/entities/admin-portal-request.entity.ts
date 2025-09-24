import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ExchangeType } from '@/modules/exchanges/types/exchange.types';

export type AdminPortalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdminPortalExchange = ExchangeType | 'UPBIT' | 'BITHUMB';

@Entity('admin_portal_requests')
export class AdminPortalRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  uid!: string;

  @Column({ type: 'varchar', length: 32 })
  exchange!: AdminPortalExchange;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: AdminPortalRequestStatus;

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
