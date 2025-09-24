import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminApprovalRequest } from './entities/admin-approval-request.entity';
import { AdminPortalRequest } from './entities/admin-portal-request.entity';
import { AdminService } from './services/admin.service';
import { AdminPortalService } from './services/admin-portal.service';
import { AdminController } from './controllers/admin.controller';
import { AdminPortalController } from './controllers/admin-portal.controller';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminApprovalRequest, AdminPortalRequest]),
    UsersModule,
  ],
  providers: [AdminService, AdminPortalService],
  controllers: [AdminController, AdminPortalController],
  exports: [AdminService, AdminPortalService],
})
export class AdminModule {}
