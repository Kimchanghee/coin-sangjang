import { Module } from '@nestjs/common';

import { TradeOrchestratorService } from './services/trade-orchestrator.service';
import { ListingsModule } from '@/modules/listings/listings.module';
import { ExchangesModule } from '@/modules/exchanges/exchanges.module';

@Module({
  imports: [ListingsModule, ExchangesModule],
  providers: [TradeOrchestratorService],
})
export class OrchestratorModule {}
