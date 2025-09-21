import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { Subscription } from 'rxjs';

import { ListingsService } from '../services/listings.service';

@WebSocketGateway({ namespace: '/listings', cors: { origin: '*' } })
@Injectable()
export class ListingsGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private subscription?: Subscription;

  constructor(private readonly listingsService: ListingsService) {}

  onModuleInit() {
    this.subscription = this.listingsService.stream$.subscribe((event) => {
      this.server.emit('listing', event);
    });
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }
}
