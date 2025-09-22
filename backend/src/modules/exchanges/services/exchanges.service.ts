import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { ExchangeAccount } from '../entities/exchange-account.entity';
import { CreateExchangeAccountDto } from '../dto/create-exchange-account.dto';
import { UpdateExchangeAccountDto } from '../dto/update-exchange-account.dto';
import { UpsertExchangeAccountDto } from '../dto/upsert-exchange-account.dto';
import {
  DEFAULT_NETWORK_MODE,
  type ExchangeAccountMetadata,
  ExchangeAvailabilityDiagnostic,
  ExchangeType,
  NetworkMode,
  OrderRequest,
  PrepareExecutionOptions,
  PrepareExecutionResult,
  SUPPORTED_EXCHANGES,
  isExchangeAccountMetadata,
  normalizeExchangeType,
} from '../types/exchange.types';
import {
  VerifyExchangeCredentialsDto,
  type VerifyExchangeCredentialsResponseDto,
} from '../dto/verify-exchange-credentials.dto';

type SupportedExchangeInput = ExchangeType | string;
type UpsertPayload = UpsertExchangeAccountDto & {
  metadata?: ExchangeAccountMetadata;
};

@Injectable()
export class ExchangesService {
  private readonly logger = new Logger(ExchangesService.name);
  private encryptionKey?: Buffer;

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
  async upsert(userId: string, dto: UpsertPayload): Promise<ExchangeAccount> {
    const exchange = this.normalizeExchangeSlug(dto.exchange);
    const { metadata: rawMetadata, ...rest } = dto;
    const metadata = this.sanitizeMetadata(rawMetadata);
    const payload: UpsertPayload = {
      ...rest,
      exchange,
      ...(metadata ? { metadata } : {}),
    };

    const existingAccount = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange,
      },
    });

    if (existingAccount) {
      return await this.updateExchangeAccount(
        userId,
        existingAccount.id,
        payload,
      );
    }

    return await this.createExchangeAccount(userId, payload);
  }

  /**
   * API 키 검증 (컨트롤러에서 사용)
   */
  async verifyCredentials(
    dto: VerifyExchangeCredentialsDto,
  ): Promise<VerifyExchangeCredentialsResponseDto> {
    const exchange = this.normalizeExchangeSlug(dto.exchange);
    const apiKeyId = this.requireCredential(
      this.coerceCredentialInput(dto.apiKeyId),
      'API 키 ID',
    );
    const apiKeySecret = this.requireCredential(
      this.coerceCredentialInput(dto.apiKeySecret),
      'API 비밀 키',
    );
    const passphrase = this.coerceCredentialInput(dto.passphrase);
    const mode = dto.mode ?? DEFAULT_NETWORK_MODE;
    const response: VerifyExchangeCredentialsResponseDto = {
      exchange,
      mode,
      connected: false,
      fingerprint: this.createCredentialFingerprint(exchange, apiKeyId, mode),
      lastCheckedAt: new Date().toISOString(),
      balances: [],
    };

    try {
      const connected = await this.validateApiKeys(
        exchange,
        apiKeyId,
        apiKeySecret,
        passphrase,
      );

      response.connected = connected;

      if (!connected) {
        response.error = '제공된 API 키가 유효하지 않습니다.';
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'API 키 검증 중 알 수 없는 오류가 발생했습니다.';
      this.logger.error(`API 키 검증 오류: ${message}`);
      response.error = message;
    }

    return response;
  }

  /**
   * 거래 실행 준비 (컨트롤러에서 사용)
   */
  prepareExecution(
    normalized: string | { symbol: string },
    options?: PrepareExecutionOptions,
  ): Promise<PrepareExecutionResult> {
    const symbol =
      typeof normalized === 'string' ? normalized : normalized.symbol;
    const useTestnet = options?.useTestnet ?? false;
    const checkedAt = new Date().toISOString();
    const diagnostics: ExchangeAvailabilityDiagnostic[] =
      SUPPORTED_EXCHANGES.map((exchange) => ({
        exchange,
        ready: true,
        available: true,
        message: useTestnet
          ? 'Testnet 환경에서 거래 준비 완료'
          : 'Ready for trading',
        checkedAt,
      }));

    const ready = diagnostics.some((d) => d.ready && d.available);

    return Promise.resolve({
      symbol,
      diagnostics,
      ready,
      useTestnet,
    });
  }

  /**
   * 거래소 계정 생성
   */
  async createExchangeAccount(
    userId: string,
    createDto: UpsertPayload,
  ): Promise<ExchangeAccount> {
    const exchange = this.normalizeExchangeSlug(createDto.exchange);
    const apiKeyId = this.requireCredential(
      this.coerceCredentialInput(createDto.apiKeyId),
      'API 키 ID',
    );
    const apiKeySecret = this.requireCredential(
      this.coerceCredentialInput(createDto.apiKeySecret),
      'API 비밀 키',
    );
    const passphrase = this.coerceCredentialInput(createDto.passphrase);
    const metadata = this.sanitizeMetadata(createDto.metadata);
    const existingAccount = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange,
      },
    });

    if (existingAccount) {
      throw new BadRequestException(
        `${exchange} 거래소 계정이 이미 존재합니다.`,
      );
    }

    const encryptedApiKeyId = this.encryptData(apiKeyId);
    const encryptedApiKeySecret = this.encryptData(apiKeySecret);
    const encryptedPassphrase = passphrase
      ? this.encryptData(passphrase)
      : undefined;

    const isValid = await this.validateApiKeys(
      exchange,
      apiKeyId,
      apiKeySecret,
      passphrase,
    );

    if (!isValid) {
      throw new BadRequestException('유효하지 않은 API 키입니다.');
    }

    const account = this.exchangeAccountRepository.create({
      userId,
      exchange,
      mode: createDto.mode ?? DEFAULT_NETWORK_MODE,
      apiKeyId: encryptedApiKeyId,
      apiKeySecret: encryptedApiKeySecret,
      passphrase: encryptedPassphrase,
      defaultLeverage: createDto.defaultLeverage ?? 5,
      isActive: createDto.isActive ?? true,
      ...(metadata ? { metadata } : {}),
    });

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
        'mode',
        'isActive',
        'defaultLeverage',
        'metadata',
        'createdAt',
        'updatedAt',
      ],
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
        'mode',
        'isActive',
        'defaultLeverage',
        'metadata',
        'createdAt',
        'updatedAt',
      ],
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
    updateDto: UpdateExchangeAccountDto | UpsertPayload,
  ): Promise<ExchangeAccount> {
    const account = await this.exchangeAccountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('거래소 계정을 찾을 수 없습니다.');
    }

    if (
      updateDto.exchange &&
      this.normalizeExchangeSlug(updateDto.exchange) !== account.exchange
    ) {
      throw new BadRequestException('거래소 유형은 변경할 수 없습니다.');
    }

    const hasApiKeyIdUpdate = updateDto.apiKeyId !== undefined;
    const hasApiKeySecretUpdate = updateDto.apiKeySecret !== undefined;
    const hasPassphraseUpdate = updateDto.passphrase !== undefined;
    const nextApiKeyId = hasApiKeyIdUpdate
      ? this.requireCredential(
          this.coerceCredentialInput(updateDto.apiKeyId),
          'API 키 ID',
        )
      : undefined;
    const nextApiKeySecret = hasApiKeySecretUpdate
      ? this.requireCredential(
          this.coerceCredentialInput(updateDto.apiKeySecret),
          'API 비밀 키',
        )
      : undefined;
    const nextPassphrase = hasPassphraseUpdate
      ? this.coerceCredentialInput(updateDto.passphrase)
      : undefined;
    const shouldValidateKeys = UpdateExchangeAccountDto.hasCredentialChanges(
      updateDto as UpdateExchangeAccountDto,
    );

    if (shouldValidateKeys) {
      const currentApiKeyId = this.requireCredential(
        this.coerceCredentialInput(this.decryptData(account.apiKeyId)),
        '저장된 API 키 ID',
      );
      const currentApiKeySecret = this.requireCredential(
        this.coerceCredentialInput(this.decryptData(account.apiKeySecret)),
        '저장된 API 비밀 키',
      );
      const currentPassphrase = this.coerceCredentialInput(
        account.passphrase ? this.decryptData(account.passphrase) : undefined,
      );

      const apiKeyId = nextApiKeyId ?? currentApiKeyId;
      const apiKeySecret = nextApiKeySecret ?? currentApiKeySecret;
      const passphrase = hasPassphraseUpdate
        ? nextPassphrase
        : currentPassphrase;

      const isValid = await this.validateApiKeys(
        account.exchange,
        apiKeyId,
        apiKeySecret,
        passphrase,
      );

      if (!isValid) {
        throw new BadRequestException('유효하지 않은 API 키입니다.');
      }

      if (typeof nextApiKeyId === 'string') {
        account.apiKeyId = this.encryptData(nextApiKeyId);
      }
      if (typeof nextApiKeySecret === 'string') {
        account.apiKeySecret = this.encryptData(nextApiKeySecret);
      }
      if (hasPassphraseUpdate) {
        account.passphrase = nextPassphrase
          ? this.encryptData(nextPassphrase)
          : undefined;
      }
    }

    if (updateDto.mode) {
      account.mode = updateDto.mode;
    }
    if (typeof updateDto.defaultLeverage === 'number') {
      account.defaultLeverage = updateDto.defaultLeverage;
    }
    if (typeof updateDto.isActive === 'boolean') {
      account.isActive = updateDto.isActive;
    }
    const metadata = this.sanitizeMetadata(updateDto.metadata);
    if (metadata) {
      account.metadata = { ...(account.metadata ?? {}), ...metadata };
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
    exchange: SupportedExchangeInput,
    apiKeyId: string,
    apiKeySecret: string,
    passphrase?: string,
  ): Promise<boolean> {
    const normalizedExchange = this.normalizeExchangeSlug(exchange);

    try {
      switch (normalizedExchange) {
        case ExchangeType.BINANCE:
          return await this.validateBinanceKeys(apiKeyId, apiKeySecret);
        case ExchangeType.BYBIT:
          return await this.validateBybitKeys(apiKeyId, apiKeySecret);
        case ExchangeType.OKX:
          return await this.validateOkxKeys(apiKeyId, apiKeySecret, passphrase);
        case ExchangeType.GATEIO:
          return await this.validateGateKeys(apiKeyId, apiKeySecret);
        case ExchangeType.BITGET:
          return await this.validateBitgetKeys(
            apiKeyId,
            apiKeySecret,
            passphrase,
          );
        default:
          break;
      }
    } catch (error) {
      this.logger.error(`API 키 검증 실패: ${error.message}`);
      return false;
    }

    throw new BadRequestException(`지원하지 않는 거래소: ${String(exchange)}`);
  }

  /**
   * Binance API 검증
   */
  private async validateBinanceKeys(
    apiKeyId: string,
    apiKeySecret: string,
  ): Promise<boolean> {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiKeySecret)
      .update(queryString)
      .digest('hex');

    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': apiKeyId,
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
    apiKeyId: string,
    apiKeySecret: string,
  ): Promise<boolean> {
    const timestamp = Date.now();
    const recvWindow = 5000;
    const queryString = `api_key=${apiKeyId}&recv_window=${recvWindow}&timestamp=${timestamp}`;

    const signature = crypto
      .createHmac('sha256', apiKeySecret)
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
    apiKeyId: string,
    apiKeySecret: string,
    passphrase?: string,
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const method = 'GET';
    const requestPath = '/api/v5/account/balance';

    const preSign = `${timestamp}${method}${requestPath}`;
    const signature = crypto
      .createHmac('sha256', apiKeySecret)
      .update(preSign)
      .digest('base64');

    const url = `https://www.okx.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': apiKeyId,
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
    apiKeyId: string,
    apiKeySecret: string,
  ): Promise<boolean> {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'GET';
    const requestPath = '/api/v4/spot/accounts';
    const queryString = '';
    const hashedPayload = crypto.createHash('sha512').update('').digest('hex');

    const preSign = `${method}\n${requestPath}\n${queryString}\n${hashedPayload}\n${timestamp}`;
    const signature = crypto
      .createHmac('sha512', apiKeySecret)
      .update(preSign)
      .digest('hex');

    const url = `https://api.gateio.ws${requestPath}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          KEY: apiKeyId,
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
    apiKeyId: string,
    apiKeySecret: string,
    passphrase?: string,
  ): Promise<boolean> {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/api/spot/v1/account/assets';

    const preSign = `${timestamp}${method}${requestPath}`;
    const signature = crypto
      .createHmac('sha256', apiKeySecret)
      .update(preSign)
      .digest('base64');

    const url = `https://api.bitget.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'ACCESS-KEY': apiKeyId,
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
    exchangeType: SupportedExchangeInput,
    orderData: OrderRequest,
  ): Promise<any> {
    const normalizedExchange = this.normalizeExchangeSlug(exchangeType);
    const account = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange: normalizedExchange,
        isActive: true,
      },
    });

    if (!account) {
      const exchangeLabel = String(normalizedExchange);
      throw new BadRequestException(
        `활성화된 ${exchangeLabel} 거래소 계정이 없습니다.`,
      );
    }

    const apiKeyId = this.decryptData(account.apiKeyId) || account.apiKeyId;
    const apiKeySecret =
      this.decryptData(account.apiKeySecret) || account.apiKeySecret;
    const passphrase = account.passphrase
      ? this.decryptData(account.passphrase)
      : undefined;

    switch (normalizedExchange) {
      case ExchangeType.BINANCE:
        return await this.executeBinanceOrder(
          apiKeyId,
          apiKeySecret,
          orderData,
        );
      case ExchangeType.BYBIT:
        return await this.executeBybitOrder(apiKeyId, apiKeySecret, orderData);
      case ExchangeType.OKX:
        return await this.executeOkxOrder(
          apiKeyId,
          apiKeySecret,
          passphrase,
          orderData,
        );
      case ExchangeType.GATEIO:
        return await this.executeGateOrder(apiKeyId, apiKeySecret, orderData);
      case ExchangeType.BITGET:
        return await this.executeBitgetOrder(
          apiKeyId,
          apiKeySecret,
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
    apiKeyId: string,
    apiKeySecret: string,
    orderData: OrderRequest,
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
      .createHmac('sha256', apiKeySecret)
      .update(queryString)
      .digest('hex');

    const url = `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKeyId,
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
    apiKeyId: string,
    apiKeySecret: string,
    orderData: OrderRequest,
  ): Promise<any> {
    const timestamp = Date.now();
    const params: Record<string, string | number | boolean | undefined> = {
      category: 'spot',
      symbol: orderData.symbol,
      side: orderData.side,
      orderType: orderData.type,
      qty: orderData.quantity,
      timestamp,
      api_key: apiKeyId,
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
      .createHmac('sha256', apiKeySecret)
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
    apiKeyId: string,
    apiKeySecret: string,
    passphrase: string | undefined,
    orderData: OrderRequest,
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
      .createHmac('sha256', apiKeySecret)
      .update(preSign)
      .digest('base64');

    const url = `https://www.okx.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': apiKeyId,
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
    apiKeyId: string,
    apiKeySecret: string,
    orderData: OrderRequest,
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const requestPath = '/api/v4/spot/orders';

    const body = JSON.stringify({
      currency_pair: orderData.symbol,
      type: orderData.type.toLowerCase(),
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
      .createHmac('sha512', apiKeySecret)
      .update(preSign)
      .digest('hex');

    const url = `https://api.gateio.ws${requestPath}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          KEY: apiKeyId,
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
    apiKeyId: string,
    apiKeySecret: string,
    passphrase: string | undefined,
    orderData: OrderRequest,
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
      .createHmac('sha256', apiKeySecret)
      .update(preSign)
      .digest('base64');

    const url = `https://api.bitget.com${requestPath}`;

    // 헤더 객체를 미리 구성
    const headers: Record<string, string> = {
      'ACCESS-KEY': apiKeyId,
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

  private encryptData(data: string): string {
    if (!data) {
      return '';
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decryptData(encryptedData?: string | null): string {
    if (!encryptedData) {
      return '';
    }

    if (!encryptedData.includes(':')) {
      return encryptedData;
    }

    const [ivHex, encrypted] = encryptedData.split(':', 2);

    if (!ivHex || !encrypted) {
      return encryptedData;
    }

    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'hex')),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? 'unknown');
      this.logger.error(`데이터 복호화에 실패했습니다: ${message}`);
      return '';
    }
  }

  private coerceCredentialInput(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private requireCredential(
    value: string | undefined,
    fieldLabel: string,
  ): string {
    if (!value) {
      throw new BadRequestException(`${fieldLabel}는 비워둘 수 없습니다.`);
    }

    return value;
  }

  private sanitizeMetadata(
    metadata?: ExchangeAccountMetadata,
  ): ExchangeAccountMetadata | undefined {
    if (!isExchangeAccountMetadata(metadata)) {
      return undefined;
    }

    const sanitized = Object.entries(metadata).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  private normalizeExchangeSlug(
    exchange: SupportedExchangeInput,
  ): ExchangeType {
    const normalized = normalizeExchangeType(exchange);

    if (!normalized) {
      throw new BadRequestException(
        `지원하지 않는 거래소: ${String(exchange)}`,
      );
    }

    return normalized;
  }

  private getEncryptionKey(): Buffer {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    const configured = this.configService.get<string>('ENCRYPTION_KEY')?.trim();

    if (configured) {
      if (/^[0-9a-fA-F]{64}$/.test(configured)) {
        this.encryptionKey = Buffer.from(configured, 'hex');
        return this.encryptionKey;
      }

      this.logger.warn(
        'ENCRYPTION_KEY는 64자리 16진수여야 합니다. 제공된 값을 기반으로 파생 키를 생성합니다.',
      );
      this.encryptionKey = crypto
        .createHash('sha256')
        .update(configured)
        .digest();
      return this.encryptionKey;
    }

    const fallbackSource =
      this.configService.get<string>('APP_SECRET') ?? 'coin-sangjang-dev-key';
    this.logger.warn(
      'ENCRYPTION_KEY가 설정되지 않았습니다. 개발 환경용 파생 키를 사용합니다.',
    );
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(fallbackSource)
      .digest();
    return this.encryptionKey;
  }

  private createCredentialFingerprint(
    exchange: ExchangeType,
    apiKeyId: string,
    mode: NetworkMode,
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${exchange}:${mode}:${apiKeyId}`)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * 거래소 계정 상태 확인
   */
  async checkAccountStatus(
    userId: string,
    exchangeType: SupportedExchangeInput,
  ): Promise<boolean> {
    const normalizedExchange = this.normalizeExchangeSlug(exchangeType);
    const account = await this.exchangeAccountRepository.findOne({
      where: {
        userId,
        exchange: normalizedExchange,
        isActive: true,
      },
    });

    if (!account) {
      return false;
    }

    const apiKeyId = this.coerceCredentialInput(
      this.decryptData(account.apiKeyId),
    );
    const apiKeySecret = this.coerceCredentialInput(
      this.decryptData(account.apiKeySecret),
    );

    if (!apiKeyId || !apiKeySecret) {
      this.logger.warn(
        `${normalizedExchange} 거래소 계정에 저장된 API 자격 증명이 비어있습니다.`,
      );
      return false;
    }

    const passphrase = this.coerceCredentialInput(
      account.passphrase ? this.decryptData(account.passphrase) : undefined,
    );

    return await this.validateApiKeys(
      normalizedExchange,
      apiKeyId,
      apiKeySecret,
      passphrase,
    );
  }
}