import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const CACHE_TTL = 3600;

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getDepartments(): Promise<string[]> {
    return this.getCached('stores:departments', async () => {
      const rows = await this.prisma.tienda.findMany({
        where: { activo: true },
        select: { departamento: true },
        distinct: ['departamento'],
        orderBy: { departamento: 'asc' },
      });
      return rows.map((r) => r.departamento);
    });
  }

  async getCities(department: string): Promise<string[]> {
    return this.getCached(`stores:cities:${department}`, async () => {
      const rows = await this.prisma.tienda.findMany({
        where: { activo: true, departamento: department },
        select: { ciudad: true },
        distinct: ['ciudad'],
        orderBy: { ciudad: 'asc' },
      });
      return rows.map((r) => r.ciudad);
    });
  }

  async getStores(department?: string, city?: string) {
    const cacheKey = `stores:list:${department ?? 'all'}:${city ?? 'all'}`;
    return this.getCached(cacheKey, async () =>
      this.prisma.tienda.findMany({
        where: {
          activo: true,
          ...(department && { departamento: department }),
          ...(city && { ciudad: city }),
        },
        select: {
          id: true,
          nombre: true,
          direccion: true,
          ciudad: true,
          departamento: true,
          telefono: true,
          horario: true,
        },
        orderBy: [
          { departamento: 'asc' },
          { ciudad: 'asc' },
          { nombre: 'asc' },
        ],
      }),
    );
  }

  private async getCached<T>(key: string, fetch: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.redis.client.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch { /* Redis no disponible */ }

    const data = await fetch();

    this.redis.client.set(key, JSON.stringify(data), 'EX', CACHE_TTL).catch(() => {});
    return data;
  }
}
