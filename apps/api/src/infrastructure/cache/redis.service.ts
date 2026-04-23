import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });

    this.client.on('error', () => { /* silenciado — Redis es opcional en dev */ });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Conexión a Redis establecida');
    } catch {
      this.logger.warn('Redis no disponible — funciones de caché deshabilitadas');
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
