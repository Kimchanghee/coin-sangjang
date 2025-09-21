import { Controller, Get, Param, Post, Body } from '@nestjs/common';

import { ExchangesService } from '../services/exchanges.service';
import { VerifyExchangeCredentialsDto } from '../dto/verify-exchange-credentials.dto';

@Controller('public/exchanges')
export class ExchangeDiagnosticsController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Post('verify')
  verify(@Body() body: VerifyExchangeCredentialsDto) {
    return this.exchangesService.verifyCredentials(body);
  }

  @Get('availability/:symbol')
  availability(@Param('symbol') symbol: string) {
    const normalized = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return this.exchangesService.prepareExecution(normalized);
  }
}
