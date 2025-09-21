import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExchangeAccount } from '../entities/exchange-account.entity';
import { EXCHANGE_ADAPTERS } from '../adapters/exchange-adapter.token';
import type { ExchangeAdapter } from '../adapters/exchange-adapter.interface';
import { UpsertExchangeAccountDto } from '../dto/upsert-exchange-account.dto';

@Injectable()
export class ExchangesService {
  constructor(
    @InjectRepository(ExchangeAccount)
    private readonly accountsRepository: Repository<ExchangeAccount>,
    @Inject(EXCHANGE_ADAPTERS) private readonly adapters: ExchangeAdapter[],
  ) {}

  listByUser(userId: string) {
    return this.accountsRepository.find({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertExchangeAccountDto) {
    const existing = await this.accountsRepository.findOne({
      where: { userId, exchange: dto.exchange, mode: dto.mode },
    });

    if (existing) {
      return this.accountsRepository.save({
        ...existing,
        ...dto,
        userId,
      });
    }

    const created = this.accountsRepository.create({
      ...dto,
      userId,
    });
    return this.accountsRepository.save(created);
  }

  async prepareExecution(symbol: string) {
    const checks = await Promise.all(
      this.adapters.map(async (adapter) => ({
        exchange: adapter.exchange,
        available: await adapter.findSymbol(symbol, { useTestnet: true }),
      })),
    );

    return {
      symbol,
      exchangesReady: checks
        .filter((item) => item.available)
        .map((item) => item.exchange),
      diagnostics: checks,
    };
  }
}
