import { Body, Controller, Get, Post } from '@nestjs/common';

import { TradePreferencesService } from '../services/trade-preferences.service';
import { UpdateTradePreferenceDto } from '../dto/update-trade-preference.dto';

@Controller('public/trade-preferences')
export class TradePreferencesController {
  constructor(
    private readonly tradePreferencesService: TradePreferencesService,
  ) {}

  @Get()
  getActivePreference() {
    return this.tradePreferencesService.getActivePreference();
  }

  @Post()
  updatePreference(@Body() body: UpdateTradePreferenceDto) {
    return this.tradePreferencesService.updatePreference(body);
  }
}
