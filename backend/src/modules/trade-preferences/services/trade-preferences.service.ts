import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TradePreference } from '../entities/trade-preference.entity';
import { UpdateTradePreferenceDto } from '../dto/update-trade-preference.dto';
import {
  ExchangeType,
  NetworkMode,
} from '@/modules/exchanges/types/exchange.types';

@Injectable()
export class TradePreferencesService {
  constructor(
    @InjectRepository(TradePreference)
    private readonly preferencesRepository: Repository<TradePreference>,
  ) {}

  async getActivePreference(): Promise<TradePreference> {
    const latest = await this.preferencesRepository.find({
      order: { updatedAt: 'DESC' },
      take: 1,
    });

    if (latest.length > 0) {
      return latest[0];
    }

    const created = this.preferencesRepository.create();
    return this.preferencesRepository.save(created);
  }

  async updatePreference(
    dto: UpdateTradePreferenceDto,
  ): Promise<TradePreference> {
    const preference = await this.getActivePreference();
    const exchangeSet = new Set<ExchangeType>(
      dto.exchanges.map((value) => this.normalizeExchange(value)),
    );

    preference.exchanges = Array.from(exchangeSet);
    preference.leverage = dto.leverage;
    preference.amountUsdt = dto.amountUsdt;
    preference.takeProfitPercent = dto.takeProfitPercent;
    preference.stopLossPercent = dto.stopLossPercent;
    preference.mode = dto.mode ?? NetworkMode.TESTNET;
    preference.autoTrade = dto.autoTrade;
    preference.entryType = dto.entryType ?? preference.entryType;

    return this.preferencesRepository.save(preference);
  }

  private normalizeExchange(input: ExchangeType): ExchangeType {
    if (Object.values(ExchangeType).includes(input)) {
      return input;
    }
    const normalized = String(input).trim().toUpperCase();
    if (Object.values(ExchangeType).includes(normalized as ExchangeType)) {
      return normalized as ExchangeType;
    }
    return ExchangeType.BINANCE;
  }
}
