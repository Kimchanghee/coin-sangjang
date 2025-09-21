import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ListingEvent } from './entities/listing-event.entity';
import { ListingsService } from './services/listings.service';
import { ListingsController } from './controllers/listings.controller';
import { ListingsPubSubController } from './controllers/pubsub.controller';
import { ListingsGateway } from './gateways/listings.gateway';
import { ExchangesModule } from '@/modules/exchanges/exchanges.module';

@Module({
  imports: [TypeOrmModule.forFeature([ListingEvent]), ExchangesModule],
  providers: [ListingsService, ListingsGateway],
  controllers: [ListingsController, ListingsPubSubController],
  exports: [ListingsService],
})
export class ListingsModule {}
