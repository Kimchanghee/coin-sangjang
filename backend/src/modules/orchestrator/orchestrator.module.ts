import { Module } from '@nestjs/common';

import { TradeOrchestratorService } from './services/trade-orchestrator.service';
import { ListingsModule } from '@/modules/listings/listings.module';
import { ExchangesModule } from '@/modules/exchanges/exchanges.module';
import { TradePreferencesModule } from '@/modules/trade-preferences/trade-preferences.module';

@Module({
  imports: [ListingsModule, ExchangesModule, TradePreferencesModule],
  providers: [TradeOrchestratorService],
})
export class OrchestratorModule {}
