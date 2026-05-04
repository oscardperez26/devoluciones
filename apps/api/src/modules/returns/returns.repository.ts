import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EstadoDevolucion, TipoEntrega, TipoReembolso } from '../../common/types/prisma-enums';
// Prisma namespace used for DevolucionItemCreateManyInput
import { PrismaService } from '../../infrastructure/database/prisma.service';

const MAX_TICKET_GENERATION_ATTEMPTS = 8;

function parseTicketSequence(ticket: string | null | undefined): number {
  if (!ticket) return 0;
  const match = ticket.match(/(\d+)$/);
  const parsed = parseInt(match?.[1] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isTicketUniqueConstraintError(error: unknown): boolean {
  const e = error as {
    code?: string;
    message?: string;
    cause?: { message?: string };
    meta?: Record<string, unknown>;
  };

  if (e?.code === 'P2002') return true;

  const target = e?.meta?.['target'];
  if (Array.isArray(target)) {
    const joined = target.map(String).join(' ');
    if (joined.includes('numero_ticket') || joined.includes('UX_devoluciones_numero_ticket')) {
      return true;
    }
  }

  const haystack = [
    e?.message ?? '',
    e?.cause?.message ?? '',
    String(error ?? ''),
  ].join(' ');

  return (
    haystack.includes('UX_devoluciones_numero_ticket') ||
    (haystack.includes('Unique constraint failed') && haystack.includes('numero_ticket'))
  );
}

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
    return this.prisma.run(() =>
      this.prisma.devolucion.findFirst({
        where: { id: returnId, pedidoId: orderId },
        select: {
          id: true,
          estado: true,
          metodoEntrega: true,
          metodoReembolso: true,
          totalReembolso: true,
          items: { select: { id: true } },
        },
      }),
    );
  }

  async findStatusByIdAndOrderId(returnId: string, orderId: string) {
    return this.prisma.run(() =>
      this.prisma.devolucion.findFirst({
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
      }),
    );
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

    const existing = await this.prisma.devolucion.findFirst({
      where: { pedidoId: orderId, estado: EstadoDevolucion.BORRADOR },
      select: { id: true },
    });

    let devolucionId: string;

    if (existing) {
      await this.prisma.devolucionItem.deleteMany({
        where: { devolucionId: existing.id },
      });
      await this.prisma.devolucion.update({
        where: { id: existing.id },
        data: { totalReembolso, correoClienteHash: emailHash },
      });
      devolucionId = existing.id;
    } else {
      const created = await this.prisma.devolucion.create({
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
        causales: JSON.stringify(i.causales),
        comentarios: i.comentarios,
        cantidad: i.cantidad,
        valorUnitario: i.valorUnitario,
      }),
    );

    await this.prisma.devolucionItem.createMany({ data: itemsData });

    const createdItems = await this.prisma.devolucionItem.findMany({
      where: { devolucionId },
      select: {
        id: true,
        pedidoItemId: true,
        causales: true,
        valorUnitario: true,
        cantidad: true,
      },
    });

    return {
      devolucionId,
      items: createdItems.map((item) => ({
        ...item,
        causales: JSON.parse(item.causales) as string[],
      })),
      totalReembolso,
    };
  }

  async updateDelivery(
    returnId: string,
    method: TipoEntrega,
    storeId?: string,
    address?: Record<string, unknown>,
  ) {
    return this.prisma.devolucion.update({
      where: { id: returnId },
      data: {
        metodoEntrega: method,
        tiendaId: storeId ?? null,
        direccionEnvio: address ? JSON.stringify(address) : null,
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
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.run(async () => {
      const latestToday = await this.prisma.devolucion.findFirst({
        where: {
          estado: { not: EstadoDevolucion.BORRADOR },
          enviadaEn: { gte: startOfDay, lt: endOfDay },
          numeroTicket: { not: null },
        },
        orderBy: { numeroTicket: 'desc' },
        select: { numeroTicket: true },
      });

      let nextSequence = parseTicketSequence(latestToday?.numeroTicket);

      for (let attempt = 1; attempt <= MAX_TICKET_GENERATION_ATTEMPTS; attempt += 1) {
        nextSequence += 1;
        const ticketNumber = `DV-${dateStr}-${String(nextSequence).padStart(4, '0')}`;

        try {
          return await this.prisma.devolucion.update({
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
        } catch (error) {
          const canRetry = attempt < MAX_TICKET_GENERATION_ATTEMPTS;
          if (!isTicketUniqueConstraintError(error) || !canRetry) throw error;
        }
      }

      throw new Error('No fue posible generar un ticket unico para la devolucion');
    });
  }
}
