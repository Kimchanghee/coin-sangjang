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
import type { ExchangeSlug, NetworkMode } from '../exchange.constants';

@Entity('exchange_accounts')
export class ExchangeAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: User) => user.exchangeAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  exchange!: ExchangeSlug;

  @Column({ type: 'varchar', length: 16 })
  mode!: NetworkMode;

  @Column({ name: 'api_key_id' })
  apiKeyId!: string;

  @Column({ name: 'api_key_secret' })
  apiKeySecret!: string;

  @Column({ nullable: true })
  passphrase?: string;

  @Column({ type: 'int', default: 5 })
  defaultLeverage!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
