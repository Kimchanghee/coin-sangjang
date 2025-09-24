import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { ExchangesModule } from '@/modules/exchanges/exchanges.module';
import { ListingsModule } from '@/modules/listings/listings.module';
import { OrchestratorModule } from '@/modules/orchestrator/orchestrator.module';
import { TradePreferencesModule } from '@/modules/trade-preferences/trade-preferences.module';
import { resolveDatabaseConfig } from '@/config/database.config';

const databaseImports = (() => {
  const config = resolveDatabaseConfig();

  if (!config) {
    console.warn(
      'Database configuration is missing. Starting without persistence-backed modules.',
    );
    return [];
  }

  return [
    TypeOrmModule.forRoot(config),
    UsersModule,
    AuthModule,
    AdminModule,
    ExchangesModule,
    ListingsModule,
    OrchestratorModule,
    TradePreferencesModule,
  ];
})();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ...databaseImports,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
