import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';

import { ListingsService } from '../services/listings.service';

interface PubSubPushBody {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

@Controller('listings/push')
export class ListingsPubSubController {
  private readonly logger = new Logger(ListingsPubSubController.name);

  constructor(private readonly listingsService: ListingsService) {}

  @Post('gcp')
  @HttpCode(204)
  async handleGcpPush(@Body() body: PubSubPushBody) {
    if (!body?.message?.data) {
      return;
    }
    const decoded = Buffer.from(body.message.data, 'base64').toString('utf8');
    try {
      const payload = JSON.parse(decoded) as {
        source: 'UPBIT' | 'BITHUMB';
        symbol: string;
        announcedAt?: string;
        payload?: Record<string, unknown>;
      };
      await this.listingsService.record({
        source: payload.source,
        symbol: payload.symbol,
        announcedAt: payload.announcedAt
          ? new Date(payload.announcedAt)
          : new Date(),
        payload: payload.payload,
      });
    } catch (error) {
      this.logger.warn(
        { decoded, err: error },
        'failed to parse pubsub payload',
      );
    }
  }
}
