import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ExchangeAccount } from '../entities/exchange-account.entity';
import { CreateExchangeAccountDto } from '../dto/create-exchange-account.dto';
import { UpdateExchangeAccountDto } from '../dto/update-exchange-account.dto';
import { ExchangeType, AccountStatus } from '../types/exchange.types';

@Injectable()
export class ExchangesService {
  private readonly logger = new Logger(ExchangesService.name);

  constructor(
    @InjectRepository(ExchangeAccount)
    private readonly exchangeAccountRepository: Repository<ExchangeAccount>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 사용자별 거래소 계정 목록 조회 (컨트롤러에서 사용)
   */
  async listByUser(userId: string): Promise<ExchangeAccount[]> {
    return await this.getExchangeAccounts(userId);
  }

  /**
   * 거래소 계정 생성 또는 업데이트 (컨트롤러에서 사용)
   */
  async upsert(userId: string, dto: any): Promise<ExchangeAccount> {
    const existingAccount = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange: dto.exchange,
      },
    });

    if (existingAccount) {
      // 업데이트
      return await this.updateExchangeAccount(userId, existingAccount.id, dto);
    } else {
      // 생성
      return await this.createExchangeAccount(userId, dto);
    }
  }

  /**
   * API 키 검증 (컨트롤러에서 사용)
   */
  async verifyCredentials(dto: any): Promise<any> {
    try {
      const isValid = await this.validateApiKeys(
        dto.exchange,
        dto.apiKey,
        dto.secretKey,
        dto.passphrase,
      );

      return {
        success: isValid,
        exchange: dto.exchange,
        message: isValid ? 'API 키 검증 성공' : 'API 키 검증 실패',
      };
    } catch (error) {
      this.logger.error(`API 키 검증 오류: ${error.message}`);
      return {
        success: false,
        exchange: dto.exchange,
        message: error.message,
      };
    }
  }

  /**
   * 거래 실행 준비 (컨트롤러에서 사용)
   */
  prepareExecution(normalized: any, options?: any): Promise<any> {
    const symbol =
      typeof normalized === 'string' ? normalized : normalized.symbol;
    const diagnostics: Array<{
      exchange: ExchangeType;
      ready: boolean;
      message: string;
    }> = [];

    // 각 거래소별 준비 상태 확인
    for (const exchange of Object.values(ExchangeType)) {
      diagnostics.push({
        exchange,
        ready: true, // 실제로는 계정 상태 등을 확인해야 함
        message: 'Ready for trading',
      });
    }

    return Promise.resolve({
      symbol,
      diagnostics,
      ready: diagnostics.some((d) => d.ready),
      useTestnet: options?.useTestnet || false,
    });
  }

  /**
   * 거래소 계정 생성
   */
  async createExchangeAccount(
    userId: string,
    createDto: CreateExchangeAccountDto,
  ): Promise<ExchangeAccount> {
    const existingAccount = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange: createDto.exchange,
      },
    });

    if (existingAccount) {
      throw new BadRequestException(
        `${createDto.exchange} 거래소 계정이 이미 존재합니다.`,
      );
    }

    // API 키 암호화
    const encryptedApiKey = this.encryptData(createDto.apiKey);
    const encryptedSecretKey = this.encryptData(createDto.secretKey);
    const encryptedPassphrase = createDto.passphrase
      ? this.encryptData(createDto.passphrase)
      : null;

    // API 키 유효성 검증
    const isValid = await this.validateApiKeys(
      createDto.exchange,
      createDto.apiKey,
      createDto.secretKey,
      createDto.passphrase,
    );

    if (!isValid) {
      throw new BadRequestException('유효하지 않은 API 키입니다.');
    }

    const account = this.exchangeAccountRepository.create({
      userId,
      exchange: createDto.exchange,
      apiKey: encryptedApiKey,
      secretKey: encryptedSecretKey,
      passphrase: encryptedPassphrase,
      isTestnet: createDto.isTestnet || false,
      status: AccountStatus.ACTIVE,
      metadata: createDto.metadata || {},
    } as any); // 타입 오류 임시 회피

    return await this.exchangeAccountRepository.save(account);
  }

  /**
   * 거래소 계정 목록 조회
   */
  async getExchangeAccounts(userId: string): Promise<ExchangeAccount[]> {
    return await this.exchangeAccountRepository.find({
      where: { userId },
      select: [
        'id',
        'exchange',
        'isTestnet',
        'status',
        'metadata',
        'createdAt',
        'updatedAt',
      ] as any, // 타입 오류 임시 회피
    });
  }

  /**
   * 특정 거래소 계정 조회
   */
  async getExchangeAccount(
    userId: string,
    accountId: string,
  ): Promise<ExchangeAccount> {
    const account = await this.exchangeAccountRepository.findOne({
      where: { id: accountId, userId },
      select: [
        'id',
        'exchange',
        'isTestnet',
        'status',
        'metadata',
        'createdAt',
        'updatedAt',
      ] as any, // 타입 오류 임시 회피
    });

    if (!account) {
      throw new BadRequestException('거래소 계정을 찾을 수 없습니다.');
    }

    return account;
  }

  /**
   * 거래소 계정 업데이트
   */
  async updateExchangeAccount(
    userId: string,
    accountId: string,
    updateDto: UpdateExchangeAccountDto,
  ): Promise<ExchangeAccount> {
    const account = await this.exchangeAccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('거래소 계정을 찾을 수 없습니다.');
    }

    // API 키 업데이트 시 재암호화 및 검증
    if (updateDto.apiKey || updateDto.secretKey) {
      const apiKey =
        updateDto.apiKey ||
        this.decryptData(account.apiKey || account['apiKeyId']);
      const secretKey =
        updateDto.secretKey || this.decryptData(account.secretKey || '');
      const passphrase =
        updateDto.passphrase ||
        (account.passphrase ? this.decryptData(account.passphrase) : undefined);

      const isValid = await this.validateApiKeys(
        account.exchange,
        apiKey,
        secretKey,
        passphrase,
      );

      if (!isValid) {
        throw new BadRequestException('유효하지 않은 API 키입니다.');
      }

      if (updateDto.apiKey) {
        (account as any).apiKey = this.encryptData(updateDto.apiKey);
      }
      if (updateDto.secretKey) {
        (account as any).secretKey = this.encryptData(updateDto.secretKey);
      }
      if (updateDto.passphrase) {
        account.passphrase = this.encryptData(updateDto.passphrase);
      }
    }

    if (updateDto.status !== undefined) {
      (account as any).status = updateDto.status;
    }

    if (updateDto.metadata) {
      account.metadata = { ...account.metadata, ...updateDto.metadata };
    }

    return await this.exchangeAccountRepository.save(account);
  }

  /**
   * 거래소 계정 삭제
   */
  async deleteExchangeAccount(
    userId: string,
    accountId: string,
  ): Promise<void> {
    const result = await this.exchangeAccountRepository.delete({
      id: accountId,
      userId,
    });

    if (result.affected === 0) {
      throw new BadRequestException('거래소 계정을 찾을 수 없습니다.');
    }
  }

  /**
   * 거래소별 API 검증
   */
  private async validateApiKeys(
    exchange: ExchangeType | string,
    apiKey: string,
    secretKey: string,
    passphrase?: string,
  ): Promise<boolean> {
    try {
      switch (exchange) {
        case ExchangeType.BINANCE:
        case 'BINANCE':
          return await this.validateBinanceKeys(apiKey, secretKey);
        case ExchangeType.BYBIT:
        case 'BYBIT':
          return await this.validateBybitKeys(apiKey, secretKey);
        case ExchangeType.OKX:
        case 'OKX':
          return await this.validateOkxKeys(apiKey, secretKey, passphrase);
        case ExchangeType.GATE:
        case 'GATE':
          return await this.validateGateKeys(apiKey, secretKey);
        case ExchangeType.BITGET:
        case 'BITGET':
          return await this.validateBitgetKeys(apiKey, secretKey, passphrase);
        default:
          throw new BadRequestException(`지원하지 않는 거래소: ${exchange}`);
      }
    } catch (error) {
      this.logger.error(`API 키 검증 실패: ${error.message}`);
      return false;
    }
  }

  /**
   * Binance API 검증
   */
  private async validateBinanceKeys(
    apiKey: string,
    secretKey: string,
  ): Promise<boolean> {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');

    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`Binance API 검증 오류: ${error.message}`);
      return false;
    }
  }

  /**
   * Bybit API 검증
   */
  private async validateBybitKeys(
    apiKey: string,
    secretKey: string,
  ): Promise<boolean> {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const queryString = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');

    const url = `https://api.bybit.com/v5/account/wallet-balance?${queryString}&sign=${signature}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      const data = await response.json();
      return data.retCode === 0;
    } catch (error) {
      this.logger.error(`Bybit API 검증 오류: ${error.message}`);
      return false;
    }
  }

  /**
   * OKX API 검증
   */
  private async validateOkxKeys(
    apiKey: string,
    secretKey: string,
    passphrase?: string,
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const method = 'GET';
    const requestPath = '/api/v5/account/balance';

    const preSign = `${timestamp}${method}${requestPath}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(preSign)
      .digest('base64');

    const url = `https://www.okx.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    };

    // passphrase가 있을 때만 헤더에 추가
    if (passphrase) {
      headers['OK-ACCESS-PASSPHRASE'] = passphrase;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      return data.code === '0';
    } catch (error) {
      this.logger.error(`OKX API 검증 오류: ${error.message}`);
      return false;
    }
  }

  /**
   * Gate.io API 검증
   */
  private async validateGateKeys(
    apiKey: string,
    secretKey: string,
  ): Promise<boolean> {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'GET';
    const requestPath = '/api/v4/spot/accounts';
    const queryString = '';
    const hashedPayload = crypto.createHash('sha512').update('').digest('hex');

    const preSign = `${method}\n${requestPath}\n${queryString}\n${hashedPayload}\n${timestamp}`;
    const signature = crypto
      .createHmac('sha512', secretKey)
      .update(preSign)
      .digest('hex');

    const url = `https://api.gateio.ws${requestPath}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          KEY: apiKey,
          SIGN: signature,
          Timestamp: timestamp.toString(),
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`Gate.io API 검증 오류: ${error.message}`);
      return false;
    }
  }

  /**
   * Bitget API 검증
   */
  private async validateBitgetKeys(
    apiKey: string,
    secretKey: string,
    passphrase?: string,
  ): Promise<boolean> {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/api/spot/v1/account/assets';

    const preSign = `${timestamp}${method}${requestPath}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(preSign)
      .digest('base64');

    const url = `https://api.bitget.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    };

    // passphrase가 있을 때만 헤더에 추가
    if (passphrase) {
      headers['ACCESS-PASSPHRASE'] = passphrase;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      return data.code === '00000';
    } catch (error) {
      this.logger.error(`Bitget API 검증 오류: ${error.message}`);
      return false;
    }
  }

  /**
   * 거래소 API 호출 (거래 실행용)
   */
  async executeOrder(
    userId: string,
    exchangeType: ExchangeType | string,
    orderData: any,
  ): Promise<any> {
    const account = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange: exchangeType as any,
        status: AccountStatus.ACTIVE as any,
      } as any,
    });

    if (!account) {
      throw new BadRequestException(
        `활성화된 ${exchangeType} 거래소 계정이 없습니다.`,
      );
    }

    const apiKey = this.decryptData(account.apiKey || account['apiKeyId']);
    const secretKey = this.decryptData(account.secretKey || '');
    const passphrase = account.passphrase
      ? this.decryptData(account.passphrase)
      : undefined;

    switch (exchangeType) {
      case ExchangeType.BINANCE:
      case 'BINANCE':
        return await this.executeBinanceOrder(apiKey, secretKey, orderData);
      case ExchangeType.BYBIT:
      case 'BYBIT':
        return await this.executeBybitOrder(apiKey, secretKey, orderData);
      case ExchangeType.OKX:
      case 'OKX':
        return await this.executeOkxOrder(
          apiKey,
          secretKey,
          passphrase,
          orderData,
        );
      case ExchangeType.GATE:
      case 'GATE':
        return await this.executeGateOrder(apiKey, secretKey, orderData);
      case ExchangeType.BITGET:
      case 'BITGET':
        return await this.executeBitgetOrder(
          apiKey,
          secretKey,
          passphrase,
          orderData,
        );
      default:
        throw new BadRequestException(`지원하지 않는 거래소: ${exchangeType}`);
    }
  }

  /**
   * Binance 주문 실행
   */
  private async executeBinanceOrder(
    apiKey: string,
    secretKey: string,
    orderData: any,
  ): Promise<any> {
    const timestamp = Date.now();
    const params: Record<string, string | number | boolean | undefined> = {
      symbol: orderData.symbol,
      side: orderData.side,
      type: orderData.type,
      quantity: orderData.quantity,
      timestamp,
      ...orderData.additionalParams,
    };

    const queryString = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');

    const url = `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      });

      return await response.json();
    } catch (error) {
      this.logger.error(`Binance 주문 실행 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bybit 주문 실행
   */
  private async executeBybitOrder(
    apiKey: string,
    secretKey: string,
    orderData: any,
  ): Promise<any> {
    const timestamp = Date.now();
    const params: Record<string, string | number | boolean | undefined> = {
      category: 'spot',
      symbol: orderData.symbol,
      side: orderData.side,
      orderType: orderData.type,
      qty: orderData.quantity,
      timestamp,
      api_key: apiKey,
      ...orderData.additionalParams,
    };

    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    const queryString = Object.entries(sortedParams)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');

    const url = `https://api.bybit.com/v5/order/create`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...params, sign: signature }),
      });

      return await response.json();
    } catch (error) {
      this.logger.error(`Bybit 주문 실행 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * OKX 주문 실행
   */
  private async executeOkxOrder(
    apiKey: string,
    secretKey: string,
    passphrase: string | undefined,
    orderData: any,
  ): Promise<any> {
    const timestamp = new Date().toISOString();
    const method = 'POST';
    const requestPath = '/api/v5/trade/order';

    const body = JSON.stringify({
      instId: orderData.symbol,
      tdMode: 'cash',
      side: orderData.side,
      ordType: orderData.type,
      sz: orderData.quantity,
      ...orderData.additionalParams,
    });

    const preSign = `${timestamp}${method}${requestPath}${body}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(preSign)
      .digest('base64');

    const url = `https://www.okx.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    };

    // passphrase가 있을 때만 헤더에 추가
    if (passphrase) {
      headers['OK-ACCESS-PASSPHRASE'] = passphrase;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      return await response.json();
    } catch (error) {
      this.logger.error(`OKX 주문 실행 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gate.io 주문 실행
   */
  private async executeGateOrder(
    apiKey: string,
    secretKey: string,
    orderData: any,
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const requestPath = '/api/v4/spot/orders';

    const body = JSON.stringify({
      currency_pair: orderData.symbol,
      type: orderData.orderType || 'limit',
      side: orderData.side,
      amount: orderData.quantity,
      ...orderData.additionalParams,
    });

    const hashedPayload = crypto
      .createHash('sha512')
      .update(body)
      .digest('hex');

    const preSign = `${method}\n${requestPath}\n\n${hashedPayload}\n${timestamp}`;
    const signature = crypto
      .createHmac('sha512', secretKey)
      .update(preSign)
      .digest('hex');

    const url = `https://api.gateio.ws${requestPath}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          KEY: apiKey,
          SIGN: signature,
          Timestamp: timestamp.toString(),
          'Content-Type': 'application/json',
        },
        body,
      });

      return await response.json();
    } catch (error) {
      this.logger.error(`Gate.io 주문 실행 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bitget 주문 실행
   */
  private async executeBitgetOrder(
    apiKey: string,
    secretKey: string,
    passphrase: string | undefined,
    orderData: any,
  ): Promise<any> {
    const timestamp = Date.now().toString();
    const method = 'POST';
    const requestPath = '/api/spot/v1/trade/orders';

    const body = JSON.stringify({
      symbol: orderData.symbol,
      side: orderData.side,
      orderType: orderData.type,
      size: orderData.quantity,
      ...orderData.additionalParams,
    });

    const preSign = `${timestamp}${method}${requestPath}${body}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(preSign)
      .digest('base64');

    const url = `https://api.bitget.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    };

    // passphrase가 있을 때만 헤더에 추가
    if (passphrase) {
      headers['ACCESS-PASSPHRASE'] = passphrase;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      return await response.json();
    } catch (error) {
      this.logger.error(`Bitget 주문 실행 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * 데이터 암호화
   */
  private encryptData(data: string): string {
    const algorithm = 'aes-256-cbc';
    const encKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encKey) {
      // 개발 환경용 기본 키 (프로덕션에서는 반드시 환경변수 사용)
      const defaultKey = crypto.randomBytes(32).toString('hex');
      this.logger.warn('ENCRYPTION_KEY not configured, using temporary key');
      const key = Buffer.from(defaultKey, 'hex');
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return `${iv.toString('hex')}:${encrypted}`;
    }

    const key = Buffer.from(encKey, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * 데이터 복호화
   */
  private decryptData(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) {
      return '';
    }

    const algorithm = 'aes-256-cbc';
    const encKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encKey) {
      this.logger.error('ENCRYPTION_KEY not configured for decryption');
      return '';
    }

    const key = Buffer.from(encKey, 'hex');

    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 거래소 계정 상태 확인
   */
  async checkAccountStatus(
    userId: string,
    exchangeType: ExchangeType | string,
  ): Promise<boolean> {
    const account = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange: exchangeType as any,
        status: AccountStatus.ACTIVE as any,
      } as any,
    });

    if (!account) {
      return false;
    }

    const apiKey = this.decryptData(
      account.apiKey || account['apiKeyId'] || '',
    );
    const secretKey = this.decryptData(account.secretKey || '');
    const passphrase = account.passphrase
      ? this.decryptData(account.passphrase)
      : undefined;

    return await this.validateApiKeys(
      exchangeType,
      apiKey,
      secretKey,
      passphrase,
    );
  }
}
