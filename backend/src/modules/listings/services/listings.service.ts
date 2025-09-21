import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';

import { ListingEvent } from '../entities/listing-event.entity';

@Injectable()
export class ListingsService {
  private readonly events$ = new Subject<ListingEvent>();

  constructor(
    @InjectRepository(ListingEvent)
    private readonly listingRepository: Repository<ListingEvent>,
  ) {}

  get stream$() {
    return this.events$.asObservable();
  }

  async record(event: Partial<ListingEvent>) {
    const saved = await this.listingRepository.save(
      this.listingRepository.create({
        ...event,
        announcedAt: event.announcedAt ?? new Date(),
      }),
    );
    this.events$.next(saved);
    return saved;
  }

  findRecent(limit = 20) {
    return this.listingRepository.find({
      order: { announcedAt: 'DESC' },
      take: limit,
    });
  }
}
