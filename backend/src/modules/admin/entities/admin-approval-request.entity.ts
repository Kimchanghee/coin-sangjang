import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import type { ExchangeSlug } from '@/modules/exchanges/exchange.constants';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Entity('admin_approval_requests')
export class AdminApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.approvalRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  exchange!: ExchangeSlug;

  @Column({ type: 'varchar', length: 64 })
  uid!: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status!: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
