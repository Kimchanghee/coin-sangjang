import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminApprovalRequest } from '../entities/admin-approval-request.entity';
import { CreateApprovalRequestDto } from '../dto/create-approval-request.dto';
import { UsersService } from '@/modules/users/services/users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminApprovalRequest)
    private readonly approvalRepository: Repository<AdminApprovalRequest>,
    private readonly usersService: UsersService,
  ) {}

  async submitRequest(userId: string, dto: CreateApprovalRequestDto) {
    const request = this.approvalRepository.create({
      userId,
      exchange: dto.exchange,
      uid: dto.uid,
      status: 'PENDING',
    });
    return this.approvalRepository.save(request);
  }

  listPending() {
    return this.approvalRepository.find({
      where: { status: 'PENDING' },
      relations: ['user'],
    });
  }

  async approve(requestId: string) {
    const request = await this.approvalRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('REQUEST_NOT_FOUND');
    }
    request.status = 'APPROVED';
    await this.approvalRepository.save(request);
    await this.usersService.markAdminApproval(request.userId, true);
    return request;
  }

  async reject(requestId: string, reason: string) {
    const request = await this.approvalRepository.findOne({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('REQUEST_NOT_FOUND');
    }
    request.status = 'REJECTED';
    request.rejectionReason = reason;
    await this.approvalRepository.save(request);
    await this.usersService.markAdminApproval(request.userId, false);
    return request;
  }
}
