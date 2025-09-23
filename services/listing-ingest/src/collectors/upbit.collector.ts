// ===================================
// 파일 경로: services/listing-ingest/src/collectors/upbit.collector.ts
// 파일 타입: 새로 생성
// ===================================

import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import Redis from 'ioredis';

interface UpbitNotice {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}

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

export class UpbitCollector extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiClient: AxiosInstance;
  private noticeApiClient: AxiosInstance;
  private redis: Redis;
  private lastCheckTime: Date;
  private checkInterval: NodeJS.Timer | null = null;
  private reconnectInterval: NodeJS.Timer | null = null;
  private processedNotices: Set<number> = new Set();
  private isRunning: boolean = false;

  constructor(redisClient?: Redis) {
    super();
    
    this.redis = redisClient || new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.lastCheckTime = new Date();
    
    // API 클라이언트 초기화
    this.apiClient = axios.create({
      baseURL: process.env.UPBIT_API_URL || 'https://api.upbit.com',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    this.noticeApiClient = axios.create({
      baseURL: process.env.UPBIT_NOTICE_URL || 'https://api-manager.upbit.com',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    this.loadProcessedNotices();
  }

  private async loadProcessedNotices() {
    try {
      const notices = await this.redis.smembers('processed_notices:upbit');
      notices.forEach(id => this.processedNotices.add(parseInt(id)));
      console.log(`[Upbit] Loaded ${this.processedNotices.size} processed notices from Redis`);
    } catch (error) {
      console.error('[Upbit] Failed to load processed notices:', error);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('[Upbit Collector] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Upbit Collector] Starting...');
    
    // 초기 공지사항 체크
    await this.checkNotices();
    
    // 30초마다 공지사항 체크
    this.checkInterval = setInterval(() => {
      this.checkNotices();
    }, 30000);

    // WebSocket 연결
    this.connectWebSocket();
  }

  private connectWebSocket() {
    try {
      const wsUrl = process.env.UPBIT_WEBSOCKET_URL || 'wss://api.upbit.com/websocket/v1';
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('[Upbit] WebSocket connected');
        
        // Ping 메시지 전송 (연결 유지)
        const pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.ping();
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
        
        // 티커 정보 구독 (모니터링용)
        const subscribeMsg = [
          { ticket: 'coin-sangjang' },
          { type: 'ticker', codes: ['KRW-BTC'] }
        ];
        
        this.ws?.send(JSON.stringify(subscribeMsg));
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          // 필요시 실시간 데이터 처리
        } catch (error) {
          // Binary 데이터일 수 있음 (Upbit는 압축된 데이터 전송)
        }
      });

      this.ws.on('error', (error) => {
        console.error('[Upbit] WebSocket error:', error.message);
      });

      this.ws.on('close', () => {
        console.log('[Upbit] WebSocket disconnected');
        if (this.isRunning) {
          setTimeout(() => this.connectWebSocket(), 5000);
        }
      });

      this.ws.on('pong', () => {
        // Pong 응답 수신
      });

    } catch (error) {
      console.error('[Upbit] WebSocket connection error:', error);
      if (this.isRunning) {
        setTimeout(() => this.connectWebSocket(), 5000);
      }
    }
  }

  async checkNotices() {
    try {
      console.log('[Upbit] Checking notices...');
      
      // 공지사항 API 호출
      const response = await this.noticeApiClient.get('/api/v1/notices', {
        params: {
          page: 1,
          per_page: 30,
          thread_name: 'general'
        }
      });

      if (!response.data || !response.data.data) {
        console.log('[Upbit] No notice data received');
        return;
      }

      const notices = response.data.data.list || [];
      console.log(`[Upbit] Found ${notices.length} notices`);
      
      for (const notice of notices) {
        // 이미 처리한 공지사항 스킵
        if (this.processedNotices.has(notice.id)) {
          continue;
        }

        // 공지사항 생성 시간 체크 (24시간 이내)
        const noticeTime = new Date(notice.created_at);
        const hoursDiff = (Date.now() - noticeTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          continue;
        }

        // 상장 관련 키워드 체크
        if (this.isListingRelated(notice.title)) {
          const listingInfo = await this.parseListingInfo(notice);
          
          if (listingInfo) {
            console.log(`[Upbit] 🚨 New listing detected: ${listingInfo.symbol} - ${listingInfo.title}`);
            
            // 이벤트 발생
            this.emit('listing', listingInfo);
            
            // 처리 완료 표시
            this.processedNotices.add(notice.id);
            await this.saveProcessedNotice(notice.id);
          }
        }
        
        // 일반 공지도 처리 완료로 표시 (중복 체크 방지)
        this.processedNotices.add(notice.id);
      }
    } catch (error) {
      console.error('[Upbit] Notice check error:', error);
    }
  }

  private isListingRelated(title: string): boolean {
    const keywords = [
      // 한국어 키워드
      '신규', '상장', '추가', '거래', '원화', 'KRW', '마켓',
      '디지털 자산', '거래 지원', '입출금',
      // 영어 키워드  
      'listing', 'trading', 'market', 'add', 'new', 'launch',
      'support', 'open', 'available'
    ];
    
    const excludeKeywords = [
      '상장폐지', '거래중지', '유의', '투자유의', '거래정지',
      'delist', 'suspend', 'warning', 'maintenance'
    ];
    
    const titleLower = title.toLowerCase();
    
    // 제외 키워드 체크
    if (excludeKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // 포함 키워드 체크
    return keywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
  }

  private async parseListingInfo(notice: UpbitNotice): Promise<ListingEvent | null> {
    try {
      // 제목에서 정보 추출
      const title = notice.title;
      
      // 심볼 추출 패턴들
      const patterns = [
        /\(([A-Z]{2,10})\)/g,        // (BTC) 형태
        /\[([A-Z]{2,10})\]/g,        // [BTC] 형태
        /\b([A-Z]{2,10})\b/g,        // 단독 대문자
        /KRW-([A-Z]{2,10})/g,        // KRW-BTC 형태
      ];

      let symbol: string | null = null;
      let koreanName: string | null = null;

      for (const pattern of patterns) {
        const matches = title.match(pattern);
        if (matches && matches.length > 0) {
          // 첫 번째 매치에서 심볼 추출
          symbol = matches[0].replace(/[\(\)\[\]KRW-]/g, '').trim();
          if (symbol.length >= 2 && symbol.length <= 10) {
            break;
          }
        }
      }

      // 한글 이름 추출 시도
      const koreanPattern = /([가-힣]+)\s*\(/;
      const koreanMatch = title.match(koreanPattern);
      if (koreanMatch) {
        koreanName = koreanMatch[1];
      }

      if (!symbol) {
        console.log(`[Upbit] Could not extract symbol from: ${title}`);
        return null;
      }

      // 상장 타입 판별
      let type: 'new_listing' | 'delisting' | 'other' = 'other';
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('신규') || titleLower.includes('상장') || 
          titleLower.includes('추가') || titleLower.includes('listing')) {
        type = 'new_listing';
      } else if (titleLower.includes('상장폐지') || titleLower.includes('거래중지') ||
                 titleLower.includes('delist') || titleLower.includes('suspend')) {
        type = 'delisting';
      }

      const listingEvent: ListingEvent = {
        exchange: 'UPBIT',
        symbol: symbol.toUpperCase(),
        koreanName: koreanName || undefined,
        title: title,
        url: `https://upbit.com/service_center/notice?id=${notice.id}`,
        timestamp: new Date(notice.created_at),
        type: type,
        rawData: notice
      };

      return listingEvent;
    } catch (error) {
      console.error('[Upbit] Parse listing info error:', error);
      return null;
    }
  }

  private async saveProcessedNotice(noticeId: number) {
    try {
      await this.redis.sadd('processed_notices:upbit', noticeId.toString());
      // 30일 후 자동 삭제
      await this.redis.expire('processed_notices:upbit', 30 * 24 * 60 * 60);
    } catch (error) {
      console.error('[Upbit] Failed to save processed notice:', error);
    }
  }

  async stop() {
    console.log('[Upbit Collector] Stopping...');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async getMarketList() {
    try {
      const response = await this.apiClient.get('/v1/market/all');
      return response.data;
    } catch (error) {
      console.error('[Upbit] Failed to get market list:', error);
      return [];
    }
  }
}

export default UpbitCollector;
