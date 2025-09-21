import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';

import {
  ListingEvent,
  MarketAvailabilitySnapshot,
} from '../entities/listing-event.entity';
import { ExchangesService } from '@/modules/exchanges/services/exchanges.service';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);
  private readonly events$ = new Subject<ListingEvent>();

  constructor(
    @InjectRepository(ListingEvent)
    private readonly listingRepository: Repository<ListingEvent>,
    @Optional() private readonly exchangesService?: ExchangesService,
  ) {}

  get stream$() {
    return this.events$.asObservable();
  }

  async record(event: Partial<ListingEvent>) {
    const announcedAt = event.announcedAt ?? new Date();
    const extractedBase = this.extractBaseSymbol(event);
    const normalizedSymbol = this.normalizeSymbol(
      event.symbol ?? (extractedBase ? `${extractedBase}USDT` : undefined),
    );
    const baseSymbol =
      extractedBase ?? normalizedSymbol?.replace(/USDT$/i, '') ?? undefined;

    const created = this.listingRepository.create({
      ...event,
      baseSymbol,
      symbol: normalizedSymbol ?? event.symbol ?? '',
      announcedAt,
    });

    let saved = await this.listingRepository.save(created);

    if (normalizedSymbol && this.exchangesService) {
      try {
        const availability = await this.exchangesService.prepareExecution(
          normalizedSymbol,
          {
            useTestnet: false,
          },
        );
        if (availability?.diagnostics?.length) {
          const snapshot: MarketAvailabilitySnapshot[] =
            availability.diagnostics.map((item) => ({
              exchange: item.exchange,
              available: Boolean(item.available),
              checkedAt: item.checkedAt,
              error: item.error,
            }));
          saved = await this.listingRepository.save({
            ...saved,
            marketsSnapshot: snapshot,
          });
        }
      } catch (error) {
        this.logger.warn(
          { symbol: normalizedSymbol, err: error },
          'Failed to enrich listing with exchange availability',
        );
      }
    }

    this.events$.next(saved);
    return saved;
  }

  findRecent(limit = 20) {
    return this.listingRepository.find({
      order: { announcedAt: 'DESC' },
      take: limit,
    });
  }

  private extractBaseSymbol(event: Partial<ListingEvent>) {
    const candidateFields: Array<string | undefined | null> = [
      event.baseSymbol,
      event.symbol,
    ];

    if (event.payload) {
      const payload = event.payload;
      const payloadCandidates = [
        payload.symbol,
        payload.baseSymbol,
        payload.code,
        payload.title,
        payload.subject,
        payload.content,
        payload.body,
      ].filter((value): value is string => typeof value === 'string');
      candidateFields.push(...payloadCandidates);
    }

    for (const candidate of candidateFields) {
      const parsed = this.extractSymbolFromText(candidate);
      if (parsed) {
        return parsed;
      }
    }

    return undefined;
  }

  private extractSymbolFromText(text?: string | null) {
    if (!text) {
      return undefined;
    }
    const normalized = text.toUpperCase();
    const parenMatch = normalized.match(/\(([A-Z0-9]{2,10})\)/);
    if (parenMatch) {
      return parenMatch[1];
    }
    const marketMatch = normalized.match(
      /(?:KRW|BTC|USDT)[\s-/]*([A-Z0-9]{2,10})/,
    );
    if (marketMatch) {
      return marketMatch[1];
    }
    const bracketMatch = normalized.match(/\[([A-Z0-9]{2,10})\]/);
    if (bracketMatch) {
      return bracketMatch[1];
    }
    const hashMatch = normalized.match(/#([A-Z0-9]{2,10})/);
    if (hashMatch) {
      return hashMatch[1];
    }
    const plainMatch = normalized.match(
      /\b([A-Z0-9]{2,10})\b(?=.*(LISTING|상장|거래지원))/,
    );
    if (plainMatch) {
      return plainMatch[1];
    }
    return undefined;
  }

  private normalizeSymbol(symbol?: string | null) {
    if (!symbol) {
      return undefined;
    }
    const sanitized = symbol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (!sanitized) {
      return undefined;
    }
    if (sanitized.length <= 3) {
      return `${sanitized}USDT`;
    }
    if (!sanitized.endsWith('USDT') && sanitized.length <= 10) {
      return `${sanitized}USDT`;
    }
    return sanitized;
  }
}
