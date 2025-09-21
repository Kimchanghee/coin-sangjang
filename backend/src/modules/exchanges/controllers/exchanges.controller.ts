import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ExchangesService } from '../services/exchanges.service';
import { UpsertExchangeAccountDto } from '../dto/upsert-exchange-account.dto';

@UseGuards(JwtAuthGuard)
@Controller('exchanges')
export class ExchangesController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Get()
  list(@Request() req: any) {
    return this.exchangesService.listByUser(req.user.sub);
  }

  @Post()
  upsert(@Request() req: any, @Body() body: UpsertExchangeAccountDto) {
    return this.exchangesService.upsert(req.user.sub, body);
  }
}
