import { Body, Controller, Get, Post, Sse, MessageEvent } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { ListingsService } from '../services/listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('recent')
  recent() {
    return this.listingsService.findRecent();
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.listingsService.stream$.pipe(
      map((event) => ({ data: event }) as MessageEvent),
    );
  }

  @Post('mock')
  mock(@Body() body: any) {
    return this.listingsService.record(body);
  }
}
