import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExchangeAccount } from './entities/exchange-account.entity';
import { BinanceFuturesAdapter } from './adapters/binance-futures.adapter';
import { BybitFuturesAdapter } from './adapters/bybit-futures.adapter';
import { OkxFuturesAdapter } from './adapters/okx-futures.adapter';
import { GateioFuturesAdapter } from './adapters/gateio-futures.adapter';
import { BitgetFuturesAdapter } from './adapters/bitget-futures.adapter';
import { EXCHANGE_ADAPTERS } from './adapters/exchange-adapter.token';
import { ExchangesService } from './services/exchanges.service';
import { ExchangesController } from './controllers/exchanges.controller';
import { ExchangeDiagnosticsController } from './controllers/exchange-diagnostics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeAccount]), HttpModule],
  providers: [
    ExchangesService,
    BinanceFuturesAdapter,
    BybitFuturesAdapter,
    OkxFuturesAdapter,
    GateioFuturesAdapter,
    BitgetFuturesAdapter,
    {
      provide: EXCHANGE_ADAPTERS,
      useFactory: (
        binance: BinanceFuturesAdapter,
        bybit: BybitFuturesAdapter,
        okx: OkxFuturesAdapter,
        gateio: GateioFuturesAdapter,
        bitget: BitgetFuturesAdapter,
      ) => [binance, bybit, okx, gateio, bitget],
      inject: [
        BinanceFuturesAdapter,
        BybitFuturesAdapter,
        OkxFuturesAdapter,
        GateioFuturesAdapter,
        BitgetFuturesAdapter,
      ],
    },
  ],
  controllers: [ExchangesController, ExchangeDiagnosticsController],
  exports: [ExchangesService, EXCHANGE_ADAPTERS],
})
export class ExchangesModule {}
