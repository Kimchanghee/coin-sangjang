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
import { TradePreferencesService } from '@/modules/trade-preferences/services/trade-preferences.service';
import {
  ExchangeType,
  NetworkMode,
} from '@/modules/exchanges/types/exchange.types';

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
    private readonly tradePreferencesService: TradePreferencesService,
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
    const preference = await this.tradePreferencesService.getActivePreference();
    const maxLeverage = this.configService.get<number>(
      'DEFAULT_MAX_LEVERAGE',
      preference.leverage,
    );
    const useTestnet = preference.mode === NetworkMode.TESTNET;

    this.logger.log(
      `Processing trade job ${job.listingId} for ${job.symbol} (L${preference.leverage}, testnet=${useTestnet})`,
    );

    const availability = await this.exchangesService.prepareExecution(
      job.symbol,
      { useTestnet },
    );

    if (!preference.autoTrade) {
      this.logger.warn(
        'Auto trading disabled in preferences, skipping execution',
      );
      return;
    }

    const allowedExchanges = new Set<ExchangeType>(
      availability.diagnostics
        .filter((diagnostic) => diagnostic.available)
        .map((diagnostic) => diagnostic.exchange),
    );

    for (const exchange of preference.exchanges) {
      if (!allowedExchanges.has(exchange)) {
        this.logger.debug(
          `Exchange ${exchange} not ready for ${job.symbol}, skipping`,
        );
        continue;
      }

      const accounts = await this.exchangesService.listActiveAccountsByExchange(
        exchange,
        useTestnet ? NetworkMode.TESTNET : undefined,
      );

      if (accounts.length === 0) {
        this.logger.warn(`No active ${exchange} accounts available`);
        continue;
      }

      for (const account of accounts) {
        const quantity = this.estimateOrderQuantity(
          preference.amountUsdt,
          Math.min(preference.leverage, maxLeverage),
        );

        try {
          await this.exchangesService.executeOrder(account.userId, exchange, {
            symbol: job.symbol,
            side: 'BUY',
            type: preference.entryType,
            quantity: quantity.toString(),
            additionalParams: {
              leverage: preference.leverage,
              takeProfitPercent: preference.takeProfitPercent,
              stopLossPercent: preference.stopLossPercent,
            },
          });
          this.logger.log(
            `Executed ${exchange} order for ${job.symbol} (account ${account.id})`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : JSON.stringify(error);
          this.logger.error(
            `Failed to execute ${exchange} order for ${job.symbol}: ${message}`,
          );
        }
      }
    }
  }

  private estimateOrderQuantity(amount: number, leverage: number) {
    const sanitizedAmount = Number.isFinite(amount) ? Math.abs(amount) : 0;
    const sanitizedLeverage = Math.max(1, Math.floor(leverage));
    const baseQuantity = sanitizedAmount / sanitizedLeverage;
    const minimum = 0.001;
    const quantity = Math.max(baseQuantity, minimum);
    return Number(quantity.toFixed(3));
  }
}
