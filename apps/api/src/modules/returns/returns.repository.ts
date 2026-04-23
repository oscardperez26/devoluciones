import { Injectable } from '@nestjs/common';
import { EstadoDevolucion, TipoEntrega, TipoReembolso } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface ReturnItemInput {
  pedidoItemId: string;
  causales: string[];
  comentarios?: string;
  cantidad: number;
  valorUnitario: number;
}

@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdAndOrderId(returnId: string, orderId: string) {
    return this.prisma.devolucion.findFirst({
      where: { id: returnId, pedidoId: orderId },
      select: {
        id: true,
        estado: true,
        metodoEntrega: true,
        metodoReembolso: true,
        totalReembolso: true,
        items: { select: { id: true } },
      },
    });
  }

  async findStatusByIdAndOrderId(returnId: string, orderId: string) {
    return this.prisma.devolucion.findFirst({
      where: { id: returnId, pedidoId: orderId },
      select: {
        id: true,
        numeroTicket: true,
        estado: true,
        metodoEntrega: true,
        metodoReembolso: true,
        totalReembolso: true,
        enviadaEn: true,
        historial: {
          select: { estadoNuevo: true, creadoEn: true, notas: true },
          orderBy: { creadoEn: 'asc' },
        },
      },
    });
  }

  async upsertDraft(
    orderId: string,
    emailHash: string,
    items: ReturnItemInput[],
  ) {
    const totalReembolso = items.reduce(
      (sum, i) => sum + i.valorUnitario * i.cantidad,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.devolucion.findFirst({
        where: { pedidoId: orderId, estado: EstadoDevolucion.BORRADOR },
        select: { id: true },
      });

      let devolucionId: string;

      if (existing) {
        await tx.devolucionItem.deleteMany({
          where: { devolucionId: existing.id },
        });
        await tx.devolucion.update({
          where: { id: existing.id },
          data: { totalReembolso, correoClienteHash: emailHash },
        });
        devolucionId = existing.id;
      } else {
        const created = await tx.devolucion.create({
          data: {
            pedidoId: orderId,
            correoClienteHash: emailHash,
            totalReembolso,
            estado: EstadoDevolucion.BORRADOR,
          },
          select: { id: true },
        });
        devolucionId = created.id;
      }

      const itemsData: Prisma.DevolucionItemCreateManyInput[] = items.map(
        (i) => ({
          devolucionId,
          pedidoItemId: i.pedidoItemId,
          causales: i.causales,
          comentarios: i.comentarios,
          cantidad: i.cantidad,
          valorUnitario: i.valorUnitario,
        }),
      );

      await tx.devolucionItem.createMany({ data: itemsData });

      const createdItems = await tx.devolucionItem.findMany({
        where: { devolucionId },
        select: {
          id: true,
          pedidoItemId: true,
          causales: true,
          valorUnitario: true,
          cantidad: true,
        },
      });

      return { devolucionId, items: createdItems, totalReembolso };
    });
  }

  async updateDelivery(
    returnId: string,
    method: TipoEntrega,
    storeId?: string,
    address?: Prisma.InputJsonObject,
  ) {
    return this.prisma.devolucion.update({
      where: { id: returnId },
      data: {
        metodoEntrega: method,
        tiendaId: storeId ?? null,
        direccionEnvio: address ?? Prisma.DbNull,
      },
      select: { id: true, metodoEntrega: true, tiendaId: true },
    });
  }

  async updateRefundMethod(returnId: string, method: TipoReembolso) {
    return this.prisma.devolucion.update({
      where: { id: returnId },
      data: { metodoReembolso: method },
      select: { id: true, metodoReembolso: true },
    });
  }

  async submitReturn(returnId: string) {
    return this.prisma.$transaction(async (tx) => {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const todayCount = await tx.devolucion.count({
        where: {
          estado: { not: EstadoDevolucion.BORRADOR },
          enviadaEn: { gte: startOfDay, lt: endOfDay },
        },
      });

      const ticketNumber = `DV-${dateStr}-${String(todayCount + 1).padStart(4, '0')}`;

      return tx.devolucion.update({
        where: { id: returnId },
        data: {
          estado: EstadoDevolucion.ENVIADA,
          numeroTicket: ticketNumber,
          enviadaEn: today,
        },
        select: {
          id: true,
          numeroTicket: true,
          estado: true,
          totalReembolso: true,
          pedido: { select: { correoCliente: true } },
        },
      });
    });
  }
}
