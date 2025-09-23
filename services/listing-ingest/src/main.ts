// ===================================
// 파일 경로: services/listing-ingest/src/main.ts
// 파일 타입: 새로 생성 (index.ts 대신 main.ts로 변경)
// ===================================

import { UpbitCollector } from './collectors/upbit.collector';
import { BithumbCollector } from './collectors/bithumb.collector';
import axios, { AxiosInstance } from 'axios';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { WebSocket } from 'ws';

// 환경변수 로드 (경로 수정)
const envPath = path.resolve(__dirname, '../../../backend/.env');
dotenv.config({ path: envPath });

interface ListingEvent {
  exchange: string;
  symbol: string;
  koreanName?: string;
  title: string;
  url: string;
  timestamp: Date;
  type: 'new_listing' | 'delisting' | 'other';
  rawData?: any;
}

interface TradingStrategy {
  shouldTrade: boolean;
  exchanges: string[];
  leverage: number;
  amountUSDT: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  timeLimit: number;
  entryType: 'market' | 'limit';
}

class ListingIngestService {
  private upbitCollector: UpbitCollector;
  private bithumbCollector: BithumbCollector;
  private redis: Redis;
  private tradeQueue: Queue;
  private notificationQueue: Queue;
  private apiClient: AxiosInstance;
  private wsClients: Set<WebSocket> = new Set();
  private activeTradings: Map<string, boolean> = new Map();
  private isRunning: boolean = false;

  constructor() {
    console.log('[ListingIngestService] Initializing...');
    console.log('[ListingIngestService] Environment loaded from:', envPath);
    
    // Redis 연결
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // 수집기 초기화
    this.upbitCollector = new UpbitCollector(this.redis);
    this.bithumbCollector = new BithumbCollector(this.redis);

    // BullMQ 큐 초기화
    this.tradeQueue = new Queue('trade-execution', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      }
    });

    this.notificationQueue = new Queue('notifications', {
      connection: this.redis
    });

    // API 클라이언트 초기화
    this.apiClient = axios.create({
      baseURL: process.env.BACKEND_API_URL || 'http://localhost:3001',
      timeout: 10000,
    });

    this.setupEventHandlers();
    this.setupWorkers();
  }

  private setupEventHandlers() {
    // Upbit 상장 이벤트 핸들러
    this.upbitCollector.on('listing', async (event: ListingEvent) => {
      console.log(`[Orchestrator] 🔔 Upbit listing event received: ${event.symbol}`);
      await this.handleListingEvent(event);
    });

    // Bithumb 상장 이벤트 핸들러
    this.bithumbCollector.on('listing', async (event: ListingEvent) => {
      console.log(`[Orchestrator] 🔔 Bithumb listing event received: ${event.symbol}`);
      await this.handleListingEvent(event);
    });

    // 에러 핸들러
    this.upbitCollector.on('error', (error) => {
      console.error('[Orchestrator] Upbit collector error:', error);
    });

    this.bithumbCollector.on('error', (error) => {
      console.error('[Orchestrator] Bithumb collector error:', error);
    });
  }

  private setupWorkers() {
    // 거래 실행 워커
    const tradeWorker = new Worker('trade-execution', 
      async (job) => {
        console.log(`[Trade Worker] Processing job #${job.id} - ${job.name}`);
        const { event, exchange, strategy } = job.data;
        
        try {
          // 거래 실행 API 호출
          const response = await this.apiClient.post('/api/trades/execute', {
            symbol: event.symbol,
            exchange: exchange,
            side: 'buy',
            type: strategy.entryType,
            amount: strategy.amountUSDT,
            leverage: strategy.leverage,
            stopLoss: strategy.stopLossPercent,
            takeProfit: strategy.takeProfitPercent,
          });

          console.log(`[Trade Worker] ✅ Trade executed: ${response.data.orderId}`);
          return response.data;
        } catch (error: any) {
          console.error(`[Trade Worker] ❌ Trade failed:`, error.message);
          throw error;
        }
      },
      {
        connection: this.redis,
        concurrency: 5,
      }
    );

    tradeWorker.on('completed', (job) => {
      console.log(`[Trade Worker] Job ${job.id} completed successfully`);
    });

    tradeWorker.on('failed', (job, err) => {
      console.error(`[Trade Worker] Job ${job?.id} failed:`, err.message);
    });
  }

  private async handleListingEvent(event: ListingEvent) {
    console.log(`[Orchestrator] 📊 Processing: ${event.exchange} - ${event.symbol}`);

    // 중복 거래 방지
    const tradeKey = `${event.exchange}:${event.symbol}`;
    if (this.activeTradings.has(tradeKey)) {
      console.log(`[Orchestrator] ⚠️ Already trading ${tradeKey}, skipping...`);
      return;
    }

    this.activeTradings.set(tradeKey, true);

    try {
      // 1. 백엔드 API에 상장 이벤트 저장
      await this.saveListingEvent(event);

      // 2. 거래 전략 결정
      const strategy = await this.determineStrategy(event);

      // 3. 자동 거래 실행 (설정된 경우)
      if (strategy.shouldTrade && process.env.ENABLE_AUTO_TRADING === 'true') {
        console.log(`[Orchestrator] 🚀 Executing trades for ${event.symbol}`);
        await this.executeTrades(event, strategy);
      } else {
        console.log(`[Orchestrator] ⏸️ Auto trading disabled or not recommended`);
      }

      // 4. 실시간 알림 전송
      await this.sendNotifications(event, strategy);

      // 5. WebSocket으로 브로드캐스트
      this.broadcastToWebSocket(event);

    } catch (error: any) {
      console.error(`[Orchestrator] ❌ Error:`, error.message);
    } finally {
      // 5분 후 거래 플래그 제거
      setTimeout(() => {
        this.activeTradings.delete(tradeKey);
      }, 5 * 60 * 1000);
    }
  }

  private async saveListingEvent(event: ListingEvent) {
    try {
      const response = await this.apiClient.post('/api/listings', {
        exchange: event.exchange,
        symbol: event.symbol,
        koreanName: event.koreanName,
        title: event.title,
        url: event.url,
        timestamp: event.timestamp,
        type: event.type,
        rawData: event.rawData,
      });
      
      console.log(`[Orchestrator] 💾 Listing saved with ID: ${response.data.id}`);
      
      // Redis에도 저장 (캐싱)
      await this.redis.setex(
        `listing:${event.exchange}:${event.symbol}`,
        3600,
        JSON.stringify(event)
      );
    } catch (error: any) {
      console.error('[Orchestrator] Failed to save listing:', error.message);
    }
  }

  private async determineStrategy(event: ListingEvent): Promise<TradingStrategy> {
    // 상장 폐지나 기타 이벤트는 거래하지 않음
    if (event.type !== 'new_listing') {
      return {
        shouldTrade: false,
        exchanges: [],
        leverage: 0,
        amountUSDT: 0,
        stopLossPercent: 0,
        takeProfitPercent: 0,
        timeLimit: 0,
        entryType: 'market'
      };
    }

    // 심볼이 이미 다른 거래소에 상장되어 있는지 확인
    const isNewCoin = await this.checkIfNewCoin(event.symbol);
    
    // 테스트 모드 체크
    const isTestMode = process.env.ENABLE_TEST_MODE === 'true';
    
    if (isNewCoin) {
      // 완전히 새로운 코인 - 공격적 전략
      console.log(`[Strategy] 🆕 New coin detected: ${event.symbol}`);
      return {
        shouldTrade: !isTestMode,
        exchanges: ['binance', 'bybit', 'okx', 'gate', 'bitget'],
        leverage: parseInt(process.env.DEFAULT_LEVERAGE || '10'),
        amountUSDT: parseInt(process.env.DEFAULT_TRADE_AMOUNT_USDT || '100'),
        stopLossPercent: parseInt(process.env.DEFAULT_STOP_LOSS_PERCENT || '5'),
        takeProfitPercent: parseInt(process.env.DEFAULT_TAKE_PROFIT_PERCENT || '20'),
        timeLimit: 60,
        entryType: 'market'
      };
    } else {
      // 이미 상장된 코인 - 보수적 전략
      console.log(`[Strategy] 📈 Existing coin: ${event.symbol}`);
      return {
        shouldTrade: !isTestMode,
        exchanges: ['binance', 'bybit'],
        leverage: 5,
        amountUSDT: 50,
        stopLossPercent: 3,
        takeProfitPercent: 10,
        timeLimit: 30,
        entryType: 'market'
      };
    }
  }

  private async checkIfNewCoin(symbol: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(`known_symbol:${symbol}`);
      
      if (exists === 0) {
        // 처음 보는 심볼 - Redis에 저장
        await this.redis.setex(`known_symbol:${symbol}`, 86400 * 30, '1');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('[Orchestrator] Symbol check error:', error.message);
      return false;
    }
  }

  private async executeTrades(event: ListingEvent, strategy: TradingStrategy) {
    console.log(`[Orchestrator] 📤 Queuing trades on ${strategy.exchanges.length} exchanges`);
    
    // 각 거래소에 대해 거래 작업 큐에 추가
    for (const exchange of strategy.exchanges) {
      const jobData = {
        event: event,
        exchange: exchange,
        strategy: strategy,
        timestamp: new Date(),
      };

      await this.tradeQueue.add(`trade-${exchange}-${event.symbol}`, jobData, {
        priority: exchange === 'binance' ? 1 : 2,
        delay: 0,
      });
      
      console.log(`[Orchestrator] ✅ Queued: ${exchange} - ${event.symbol}`);
    }
  }

  private async sendNotifications(event: ListingEvent, strategy: TradingStrategy) {
    const notification = {
      type: 'LISTING_ALERT',
      title: `🚨 ${event.exchange} 신규 상장 알림`,
      message: `${event.symbol}${event.koreanName ? ` (${event.koreanName})` : ''} 상장 감지`,
      event: event,
      strategy: strategy,
      timestamp: new Date(),
    };

    // 알림 큐에 추가
    await this.notificationQueue.add('send-notification', notification);

    // Telegram 알림
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await this.sendTelegramNotification(notification);
    }

    // Discord 알림
    if (process.env.DISCORD_WEBHOOK_URL) {
      await this.sendDiscordNotification(notification);
    }
  }

  private async sendTelegramNotification(notification: any) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      const message = `
🚨 <b>${notification.title}</b>

📊 거래소: ${notification.event.exchange}
💎 심볼: ${notification.event.symbol}
📝 제목: ${notification.event.title}
🔗 링크: ${notification.event.url}
⏰ 시간: ${new Date().toLocaleString('ko-KR')}

${notification.strategy.shouldTrade ? '✅ 자동 거래 실행됨' : '⚠️ 자동 거래 비활성'}
      `.trim();

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
      
      console.log('[Notification] ✅ Telegram sent');
    } catch (error: any) {
      console.error('[Notification] Telegram failed:', error.message);
    }
  }

  private async sendDiscordNotification(notification: any) {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      
      const embed = {
        title: notification.title,
        description: notification.message,
        color: 0xff0000,
        fields: [
          { name: '거래소', value: notification.event.exchange, inline: true },
          { name: '심볼', value: notification.event.symbol, inline: true },
          { name: '타입', value: notification.event.type, inline: true },
          { name: '링크', value: notification.event.url },
        ],
        timestamp: notification.timestamp,
      };

      await axios.post(webhookUrl!, {
        embeds: [embed],
      });
      
      console.log('[Notification] ✅ Discord sent');
    } catch (error: any) {
      console.error('[Notification] Discord failed:', error.message);
    }
  }

  private broadcastToWebSocket(event: ListingEvent) {
    const message = JSON.stringify({
      type: 'LISTING_EVENT',
      data: event,
      timestamp: new Date(),
    });

    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async start() {
    if (this.isRunning) {
      console.log('[ListingIngestService] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[ListingIngestService] Starting service...');
    
    // 설정 출력
    console.log('[ListingIngestService] Configuration:');
    console.log(`  - Auto Trading: ${process.env.ENABLE_AUTO_TRADING || 'false'}`);
    console.log(`  - Test Mode: ${process.env.ENABLE_TEST_MODE || 'true'}`);
    console.log(`  - Default Leverage: ${process.env.DEFAULT_LEVERAGE || '10'}x`);
    console.log(`  - Default Amount: ${process.env.DEFAULT_TRADE_AMOUNT_USDT || '100'} USDT`);

    // Redis 연결 테스트
    try {
      await this.redis.ping();
      console.log('[ListingIngestService] ✅ Redis connected');
    } catch (error: any) {
      console.error('[ListingIngestService] ❌ Redis connection failed:', error.message);
      process.exit(1);
    }

    // 수집기 시작
    await this.upbitCollector.start();
    await this.bithumbCollector.start();

    console.log('[ListingIngestService] ✅ Service started successfully');
    console.log('[ListingIngestService] 👀 Monitoring:');
    console.log('  - Upbit: Every 30 seconds');
    console.log('  - Bithumb: Every 30 seconds');
    console.log('[ListingIngestService] Waiting for new listings...\n');

    // 종료 시그널 처리
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private async shutdown() {
    console.log('\n[ListingIngestService] Shutting down...');
    this.isRunning = false;
    
    await this.upbitCollector.stop();
    await this.bithumbCollector.stop();
    await this.tradeQueue.close();
    await this.notificationQueue.close();
    await this.redis.quit();
    
    console.log('[ListingIngestService] ✅ Shutdown complete');
    process.exit(0);
  }
}

// 메인 실행
if (require.main === module) {
  const service = new ListingIngestService();
  service.start().catch(error => {
    console.error('[ListingIngestService] ❌ Failed to start:', error);
    process.exit(1);
  });
}

export default ListingIngestService;
