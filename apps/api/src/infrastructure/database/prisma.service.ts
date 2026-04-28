import { Injectable, Logger, OnModuleDestroy, OnModuleInit, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '@prisma/client';

const SOCKET_CODES = new Set(['ESOCKET', 'ECONNRESET', 'ECONNREFUSED', 'ENOTOPEN']);

function isConnectionError(error: unknown): boolean {
  const e = error as Record<string, unknown>;
  if (SOCKET_CODES.has(e?.['code'] as string)) return true;
  const msg = (e?.['message'] as string) ?? '';
  return msg.includes('ECONNRESET') || msg.includes('Connection lost') || msg.includes('ENOTOPEN');
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    super({
      adapter: new PrismaMssql({
        server: configService.getOrThrow<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '1433', 10),
        user: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        options: { trustServerCertificate: true },
        // Cierra conexiones ociosas cada 5 s para evitar que SQL Server las descarte
        pool: { max: 10, min: 0, idleTimeoutMillis: 5000 },
        connectionTimeout: 30000,
        requestTimeout: 30000,
      }),
    });
  }

  async onModuleInit() {
    this.logger.log('PrismaService inicializado');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Ejecuta fn y reintenta una vez si la conexión fue descartada por SQL Server. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (!isConnectionError(error)) throw error;
      this.logger.warn('Conexión perdida — reconectando y reintentando...');
      try { await this.$disconnect(); } catch { /* ignorar */ }
      await this.$connect();
      return fn();
    }
  }

  async checkConnection(): Promise<void> {
    await this.$queryRawUnsafe('SELECT 1');
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      void app.close();
    });
  }
}
