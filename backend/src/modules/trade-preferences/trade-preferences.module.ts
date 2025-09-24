import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TradePreference } from './entities/trade-preference.entity';
import { TradePreferencesService } from './services/trade-preferences.service';
import { TradePreferencesController } from './controllers/trade-preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TradePreference])],
  providers: [TradePreferencesService],
  controllers: [TradePreferencesController],
  exports: [TradePreferencesService],
})
export class TradePreferencesModule {}
