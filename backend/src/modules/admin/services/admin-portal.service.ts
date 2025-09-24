import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminPortalRequest } from '../entities/admin-portal-request.entity';
import {
  CreatePortalRequestDto,
  ADMIN_PORTAL_EXCHANGES,
} from '../dto/create-portal-request.dto';
import { ReviewPortalRequestDto } from '../dto/review-portal-request.dto';

@Injectable()
export class AdminPortalService {
  constructor(
    @InjectRepository(AdminPortalRequest)
    private readonly portalRepository: Repository<AdminPortalRequest>,
  ) {}

  async createRequest(dto: CreatePortalRequestDto) {
    const normalizedExchange = this.normalizeExchange(dto.exchange);

    const existing = await this.portalRepository.findOne({
      where: {
        uid: dto.uid,
        exchange: normalizedExchange,
        status: 'PENDING',
      },
    });

    if (existing) {
      existing.memo = dto.memo ?? existing.memo;
      return this.portalRepository.save(existing);
    }

    const request = this.portalRepository.create({
      uid: dto.uid,
      exchange: normalizedExchange,
      status: 'PENDING',
      memo: dto.memo,
    });
    return this.portalRepository.save(request);
  }

  listRequests() {
    return this.portalRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async approveRequest(id: string, dto?: ReviewPortalRequestDto) {
    const request = await this.getById(id);
    request.status = 'APPROVED';
    request.memo = dto?.memo ?? request.memo;
    request.reviewedAt = new Date();
    return this.portalRepository.save(request);
  }

  async rejectRequest(id: string, dto?: ReviewPortalRequestDto) {
    const request = await this.getById(id);
    request.status = 'REJECTED';
    request.memo = dto?.memo ?? request.memo;
    request.reviewedAt = new Date();
    return this.portalRepository.save(request);
  }

  private async getById(id: string) {
    const request = await this.portalRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('PORTAL_REQUEST_NOT_FOUND');
    }
    return request;
  }

  private normalizeExchange(exchange: string) {
    const upper = exchange.trim().toUpperCase();
    if (
      ADMIN_PORTAL_EXCHANGES.includes(
        upper as (typeof ADMIN_PORTAL_EXCHANGES)[number],
      )
    ) {
      return upper as AdminPortalRequest['exchange'];
    }
    return 'UPBIT';
  }
}
