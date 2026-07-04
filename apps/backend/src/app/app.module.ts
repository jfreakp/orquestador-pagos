import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OrquestadorPrismaModule } from '@orquestador/prisma';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { LoggingInterceptor } from '../common/logging.interceptor';
import { GatewayConfigModule } from '../gateway-config/gateway-config.module';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionErrorsModule } from '../transaction-errors/transaction-errors.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OrquestadorPrismaModule,
    AdminAuthModule,
    PaymentsModule,
    CatalogsModule,
    GatewayConfigModule,
    TransactionsModule,
    TransactionErrorsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
