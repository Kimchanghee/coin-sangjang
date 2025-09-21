import { Body, Controller, Get, Post } from '@nestjs/common';

import { ListingsService } from '../services/listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('recent')
  recent() {
    return this.listingsService.findRecent();
  }

  @Post('mock')
  mock(@Body() body: any) {
    return this.listingsService.record(body);
  }
}
