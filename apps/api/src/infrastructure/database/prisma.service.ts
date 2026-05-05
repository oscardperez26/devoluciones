import { Injectable, Logger, OnModuleDestroy, OnModuleInit, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '@prisma/client';

const SOCKET_CODES = new Set(['ESOCKET', 'ECONNRESET', 'ECONNREFUSED', 'ENOTOPEN', 'ETIMEOUT']);
const MAX_RETRIES = 3;
const RETRY_DELAYS = [800, 1600, 3200];

function isConnectionError(error: unknown): boolean {
  const e = error as Record<string, unknown>;
  if (SOCKET_CODES.has(e?.['code'] as string)) return true;
  const msg    = (e?.['message'] as string) ?? '';
  const cause  = (e?.['cause'] as Record<string, unknown> | undefined)?.['message'] as string | undefined;
  const haystack = `${msg} ${cause ?? ''} ${String(error ?? '')}`;
  return (
    haystack.includes('ECONNRESET') ||
    haystack.includes('Connection lost') ||
    haystack.includes('ENOTOPEN') ||
    haystack.includes('ESOCKET') ||
    haystack.includes('socket hang up') ||
    haystack.includes('read ECONNRESET')
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveTimer?: ReturnType<typeof setInterval>;

  constructor(configService: ConfigService) {
    super({
      adapter: new PrismaMssql({
        server: configService.getOrThrow<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '1433', 10),
        user: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        options: { trustServerCertificate: true },
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
        connectionTimeout: 15000,
        requestTimeout: 30000,
      }),
    });
  }

  async onModuleInit() {
    this.logger.log('PrismaService inicializado');
    // Ping cada 90s — mantiene al menos una conexión viva antes de que SQL Server
    // la mate por idle (el timeout por defecto de SQL Server Express es ~5 min)
    this.keepAliveTimer = setInterval(() => {
      void this.$queryRawUnsafe('SELECT 1').catch(() => {});
    }, 90_000);
  }

  async onModuleDestroy() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    await this.$disconnect();
  }

  /** Ejecuta fn y reintenta ante errores transitorios de conexión SQL Server. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        const canRetry = attempt < MAX_RETRIES;
        if (!isConnectionError(error) || !canRetry) throw error;

        const delay = RETRY_DELAYS[attempt - 1] ?? 3200;
        this.logger.warn(
          `Conexión perdida — reintentando en ${delay}ms (intento ${attempt + 1}/${MAX_RETRIES})...`,
        );
        await wait(delay);
      }
    }
    throw new Error('No fue posible ejecutar la consulta tras varios intentos');
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
