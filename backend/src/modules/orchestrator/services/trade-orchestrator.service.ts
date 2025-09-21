import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListingsService } from '@/modules/listings/services/listings.service';
import { ExchangesService } from '@/modules/exchanges/services/exchanges.service';
import type { ListingEvent } from '@/modules/listings/entities/listing-event.entity';
import { Subject, Subscription } from 'rxjs';

interface TradeJobPayload {
  listingId: string;
  symbol: string;
  exchangeAccounts: string[];
}

@Injectable()
export class TradeOrchestratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TradeOrchestratorService.name);
  private readonly queue$ = new Subject<TradeJobPayload>();
  private listingsSub?: Subscription;
  private queueSub?: Subscription;

  constructor(
    private readonly listingsService: ListingsService,
    private readonly exchangesService: ExchangesService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.listingsSub = this.listingsService.stream$.subscribe(
      (event: ListingEvent) => {
        this.queue$.next({
          listingId: event.id,
          symbol: event.symbol,
          exchangeAccounts: [],
        });
      },
    );

    this.queueSub = this.queue$.subscribe((job) => {
      void this.processJob(job);
    });
  }

  onModuleDestroy() {
    this.listingsSub?.unsubscribe();
    this.queueSub?.unsubscribe();
  }

  private async processJob(job: TradeJobPayload) {
    const maxLeverage = this.configService.get<number>(
      'DEFAULT_MAX_LEVERAGE',
      20,
    );
    this.logger.log(
      `Processing trade job ${job.listingId} for ${job.symbol} with max L${maxLeverage}`,
    );
    // TODO: integrate BullMQ queue and exchange adapters once implemented
    await this.exchangesService.prepareExecution(job.symbol);
  }
}
