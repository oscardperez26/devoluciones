import { Injectable } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHello() {
    const totalPedidos = await this.prisma.pedido.count();

    return {
      message: 'Backend funcionando con NestJS + Prisma',
      totalPedidos,
    };
  }
}
