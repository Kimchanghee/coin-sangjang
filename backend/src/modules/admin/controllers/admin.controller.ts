import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '@/modules/auth/strategies/jwt.strategy';
import { AdminService } from '../services/admin.service';
import { CreateApprovalRequestDto } from '../dto/create-approval-request.dto';

interface RequestWithUser {
  user: JwtPayload;
}

@Controller('admin/approvals')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  submit(
    @Request() req: RequestWithUser,
    @Body() body: CreateApprovalRequestDto,
  ) {
    return this.adminService.submitRequest(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  pending(@Request() req: RequestWithUser) {
    this.ensureAdmin(req.user);
    return this.adminService.listPending();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Request() req: RequestWithUser) {
    this.ensureAdmin(req.user);
    return this.adminService.approve(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body('reason') reason?: string,
  ) {
    this.ensureAdmin(req.user);
    return this.adminService.reject(id, reason ?? 'Rejected by admin');
  }

  private ensureAdmin(user: JwtPayload) {
    if (!user.roles?.includes('admin')) {
      throw new ForbiddenException('ADMIN_ONLY');
    }
  }
}
