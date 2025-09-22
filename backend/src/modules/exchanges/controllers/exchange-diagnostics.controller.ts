import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';

import { ExchangesService } from '../services/exchanges.service';
import {
  VerifyExchangeCredentialsDto,
  type VerifyExchangeCredentialsResponseDto,
} from '../dto/verify-exchange-credentials.dto';
import type { NetworkMode } from '../exchange.constants';

@Controller('public/exchanges')
export class ExchangeDiagnosticsController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Post('verify')
  verify(
    @Body() body: VerifyExchangeCredentialsDto,
  ): Promise<VerifyExchangeCredentialsResponseDto> {
    return this.exchangesService.verifyCredentials(body);
  }

  @Get('availability/:symbol')
  availability(
    @Param('symbol') symbol: string,
    @Query('mode') mode?: NetworkMode,
  ) {
    const normalized = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const useTestnet = (mode ?? 'MAINNET') === 'TESTNET';
    return this.exchangesService.prepareExecution(normalized, { useTestnet });
  }
}
