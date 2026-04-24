import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { validateEnvironment } from './config/env.schema';
import { RedisModule } from './infrastructure/cache/redis.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReturnAccessModule } from './modules/return-access/return-access.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { ReturnRulesModule } from './modules/return-rules/return-rules.module';
import { AdminModule } from './modules/admin/admin.module';
import { EvidencesModule } from './modules/evidences/evidences.module';
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', 'apps/api/.env'],
      validate: validateEnvironment,
    }),
    PrismaModule,
    RedisModule,
    AuditModule,
    ReturnAccessModule,
    OrdersModule,
    ReturnsModule,
    StoresModule,
    ReturnRulesModule,
    AdminModule,
    EvidencesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
