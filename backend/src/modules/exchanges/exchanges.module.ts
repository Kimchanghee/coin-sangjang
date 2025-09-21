import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExchangeAccount } from './entities/exchange-account.entity';
import { BinanceFuturesAdapter } from './adapters/binance-futures.adapter';
import { EXCHANGE_ADAPTERS } from './adapters/exchange-adapter.token';
import { ExchangesService } from './services/exchanges.service';
import { ExchangesController } from './controllers/exchanges.controller';
import { ExchangeDiagnosticsController } from './controllers/exchange-diagnostics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeAccount]), HttpModule],
  providers: [
    ExchangesService,
    BinanceFuturesAdapter,
    {
      provide: EXCHANGE_ADAPTERS,
      useFactory: (binance: BinanceFuturesAdapter) => [binance],
      inject: [BinanceFuturesAdapter],
    },
  ],
  controllers: [ExchangesController, ExchangeDiagnosticsController],
  exports: [ExchangesService, EXCHANGE_ADAPTERS],
})
export class ExchangesModule {}
