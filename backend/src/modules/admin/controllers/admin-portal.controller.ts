import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AdminPortalService } from '../services/admin-portal.service';
import { CreatePortalRequestDto } from '../dto/create-portal-request.dto';
import { ReviewPortalRequestDto } from '../dto/review-portal-request.dto';

@Controller('admin/portal')
export class AdminPortalController {
  private readonly portalPassword: string;

  constructor(
    private readonly adminPortalService: AdminPortalService,
    private readonly configService: ConfigService,
  ) {
    this.portalPassword =
      this.configService.get<string>('ADMIN_PORTAL_PASSWORD') ?? 'Ckdgml9788@';
  }

  @Post('requests')
  createRequest(@Body() body: CreatePortalRequestDto) {
    return this.adminPortalService.createRequest(body);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body('password') password: string) {
    this.ensurePassword(password);
    return { success: true };
  }

  @Get('requests')
  listRequests(@Headers('x-admin-password') password: string | undefined) {
    this.ensurePassword(password);
    return this.adminPortalService.listRequests();
  }

  @Patch('requests/:id/approve')
  approve(
    @Param('id') id: string,
    @Headers('x-admin-password') password: string | undefined,
    @Body() body: ReviewPortalRequestDto,
  ) {
    this.ensurePassword(password);
    return this.adminPortalService.approveRequest(id, body);
  }

  @Patch('requests/:id/reject')
  reject(
    @Param('id') id: string,
    @Headers('x-admin-password') password: string | undefined,
    @Body() body: ReviewPortalRequestDto,
  ) {
    this.ensurePassword(password);
    return this.adminPortalService.rejectRequest(id, body);
  }

  private ensurePassword(password?: string) {
    if (!password || password !== this.portalPassword) {
      throw new UnauthorizedException('INVALID_PORTAL_PASSWORD');
    }
  }
}
