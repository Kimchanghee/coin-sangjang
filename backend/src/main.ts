import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Cloud Run의 PORT 환경변수 사용 (기본값 8080)
  const port = process.env.PORT || 8080;
  
  // 0.0.0.0으로 바인딩하여 컨테이너 외부에서 접근 가능하게 함
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend application is running on: http://0.0.0.0:${port}/api`);
  console.log(`📱 WebSocket server is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
