import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWithItemsAndReturns(orderId: string) {
    return this.prisma.pedido.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        numeroPedido: true,
        fechaEntrega: true,
        fechaCompra: true,
        items: {
          select: {
            id: true,
            sku: true,
            nombreProducto: true,
            talla: true,
            color: true,
            precioUnitario: true,
            urlImagen: true,
            esDevolvible: true,
            devoluciones: {
              select: {
                devolucion: {
                  select: { id: true, estado: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
