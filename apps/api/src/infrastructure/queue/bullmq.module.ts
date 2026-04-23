import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: new Redis(config.getOrThrow<string>('REDIS_URL'), {
          maxRetriesPerRequest: null,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class BullMQModule {}
