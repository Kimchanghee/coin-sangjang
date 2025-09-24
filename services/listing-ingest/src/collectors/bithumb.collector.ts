import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import Redis from 'ioredis';

interface BithumbNotice {
  id?: number | string;
  title?: string;
  subject?: string;
  contents?: string;
  content?: string;
  createdAt?: string;
  regDate?: string;
  postDate?: string;
  [key: string]: unknown;
}

export interface ListingEvent {
  exchange: string;
  symbol: string;
  koreanName?: string;
  title: string;
  url: string;
  timestamp: Date;
  type: 'new_listing' | 'delisting' | 'other';
  rawData?: unknown;
}

const BITHUMB_ENDPOINTS = [
  'https://capi.bithumb.com/public/board/7',
  'https://capi.bithumb.com/public/board/5',
];

const LISTING_KEYWORDS = [
  '상장',
  '거래지원',
  '신규',
  'listing',
  'market',
  'launch',
];

const NEGATIVE_KEYWORDS = ['폐지', '유의', '중지', 'delist', 'warning'];

export class BithumbCollector extends EventEmitter {
  private readonly apiClients: AxiosInstance[];
  private readonly redis: Redis;
  private readonly processedNotices = new Set<string>();
  private checkInterval: NodeJS.Timer | null = null;
  private isRunning = false;
  private checking = false;

  constructor(redisClient?: Redis) {
    super();
    this.redis = redisClient ||
      new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      });

    this.apiClients = BITHUMB_ENDPOINTS.map((endpoint) =>
      axios.create({
        baseURL: endpoint,
        timeout: 7000,
        headers: {
          'User-Agent': 'coin-sangjang-listing-ingest/1.0',
          Accept: 'application/json',
        },
      }),
    );

    void this.restoreProcessedNotices();
  }

  private async restoreProcessedNotices() {
    try {
      const cached = await this.redis.smembers('processed_notices:bithumb');
      cached.forEach((id) => this.processedNotices.add(id));
    } catch (error) {
      console.warn('[Bithumb] Failed to restore processed notices', error);
    }
  }

  async start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    await this.checkNotices();
    this.checkInterval = setInterval(() => {
      void this.checkNotices();
    }, 1000);
  }

  async stop() {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkNotices() {
    if (!this.isRunning || this.checking) {
      return;
    }
    this.checking = true;
    try {
      for (const client of this.apiClients) {
        try {
          const response = await client.get('');
          const notices = this.normalizePayload(response.data);
          await this.processNotices(notices);
          break;
        } catch (error) {
          console.warn('[Bithumb] endpoint failed, trying next', error);
          continue;
        }
      }
    } finally {
      this.checking = false;
    }
  }

  private async processNotices(notices: BithumbNotice[]) {
    for (const notice of notices) {
      const id = this.extractId(notice);
      if (!id || this.processedNotices.has(id)) {
        continue;
      }

      const title = this.extractTitle(notice);
      if (!title) {
        this.processedNotices.add(id);
        continue;
      }

      if (!this.isListingRelated(title, notice)) {
        this.processedNotices.add(id);
        continue;
      }

      const symbol = this.extractSymbol(title, notice);
      if (!symbol) {
        this.processedNotices.add(id);
        continue;
      }

      const event: ListingEvent = {
        exchange: 'BITHUMB',
        symbol,
        koreanName: this.extractKoreanName(title),
        title,
        url: this.buildNoticeUrl(id, notice),
        timestamp: this.parseTimestamp(notice),
        type: this.detectListingType(title),
        rawData: notice,
      };

      this.emit('listing', event);
      this.processedNotices.add(id);
      await this.redis.sadd('processed_notices:bithumb', id);
      await this.redis.expire('processed_notices:bithumb', 30 * 24 * 60 * 60);
    }
  }

  private normalizePayload(data: unknown): BithumbNotice[] {
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data as BithumbNotice[];
    }
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return this.normalizePayload(parsed);
      } catch {
        return [];
      }
    }
    if (typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const candidateKeys = ['data', 'list', 'content', 'items'];
      for (const key of candidateKeys) {
        const value = record[key];
        if (Array.isArray(value)) {
          return value as BithumbNotice[];
        }
      }
    }
    return [];
  }

  private extractId(notice: BithumbNotice) {
    const candidates = [
      notice.id,
      notice.noticeId,
      notice.article_id,
      notice.seq,
      notice.boardSeq,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'number') {
        return String(candidate);
      }
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return undefined;
  }

  private extractTitle(notice: BithumbNotice) {
    const candidates = [notice.title, notice.subject];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    return undefined;
  }

  private isListingRelated(title: string, notice: BithumbNotice) {
    const combined = [
      title,
      typeof notice.contents === 'string' ? notice.contents : '',
      typeof notice.content === 'string' ? notice.content : '',
    ]
      .join(' ')
      .toLowerCase();

    if (NEGATIVE_KEYWORDS.some((keyword) => combined.includes(keyword))) {
      return false;
    }

    return LISTING_KEYWORDS.some((keyword) =>
      combined.includes(keyword.toLowerCase()),
    );
  }

  private extractSymbol(title: string, notice: BithumbNotice) {
    const fields = [title];
    if (typeof notice.contents === 'string') {
      fields.push(notice.contents);
    }
    if (typeof notice.content === 'string') {
      fields.push(notice.content);
    }

    for (const field of fields) {
      const match = field?.match(/\b([A-Z0-9]{2,10})\b(?=.*(USDT|KRW|상장|LISTING))/i);
      if (match) {
        return `${match[1].toUpperCase()}USDT`;
      }
      const bracket = field?.match(/\(([A-Z0-9]{2,10})\)/);
      if (bracket) {
        return `${bracket[1].toUpperCase()}USDT`;
      }
    }
    return undefined;
  }

  private extractKoreanName(title: string) {
    const match = title.match(/([가-힣]{2,})\s*\(/);
    return match ? match[1] : undefined;
  }

  private buildNoticeUrl(id: string, notice: BithumbNotice) {
    if (typeof notice?.link === 'string') {
      return notice.link;
    }
    if (typeof notice?.url === 'string') {
      return notice.url;
    }
    return `https://www.bithumb.com/notice/detail/${encodeURIComponent(id)}`;
  }

  private parseTimestamp(notice: BithumbNotice) {
    const candidates = [notice.createdAt, notice.regDate, notice.postDate];
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const parsed = new Date(candidate);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return new Date();
  }

  private detectListingType(title: string): ListingEvent['type'] {
    const lowered = title.toLowerCase();
    if (lowered.includes('폐지') || lowered.includes('delist')) {
      return 'delisting';
    }
    if (
      lowered.includes('상장') ||
      lowered.includes('거래지원') ||
      lowered.includes('listing')
    ) {
      return 'new_listing';
    }
    return 'other';
  }
}
