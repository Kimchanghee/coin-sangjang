import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExchangeAccount } from '@/modules/exchanges/entities/exchange-account.entity';
import { AdminApprovalRequest } from '@/modules/admin/entities/admin-approval-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 'ko' })
  locale!: string;

  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'varchar', array: true, default: () => "'{user}'" })
  roles!: string[];

  @Column({ default: false })
  adminApproved!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  profile?: Record<string, unknown>;

  @OneToMany(() => ExchangeAccount, (account) => account.user)
  exchangeAccounts!: ExchangeAccount[];

  @OneToMany(() => AdminApprovalRequest, (request) => request.user)
  approvalRequests!: AdminApprovalRequest[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
