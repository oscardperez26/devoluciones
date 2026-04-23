import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EstadoDevolucion } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import type { AdminUser } from '../../common/decorators/admin-user.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AdminReturnsQueryDto } from './dto/admin-returns-query.dto';
import type { UpdateReturnStatusDto } from './dto/update-return-status.dto';

const VALID_TRANSITIONS: Partial<Record<EstadoDevolucion, EstadoDevolucion[]>> =
  {
    [EstadoDevolucion.ENVIADA]: [EstadoDevolucion.EN_REVISION],
    [EstadoDevolucion.EN_REVISION]: [
      EstadoDevolucion.APROBADA,
      EstadoDevolucion.RECHAZADA,
    ],
    [EstadoDevolucion.APROBADA]: [EstadoDevolucion.PRODUCTO_RECIBIDO],
    [EstadoDevolucion.PRODUCTO_RECIBIDO]: [
      EstadoDevolucion.REEMBOLSO_EN_PROCESO,
    ],
    [EstadoDevolucion.REEMBOLSO_EN_PROCESO]: [EstadoDevolucion.COMPLETADA],
  };

@Injectable()
export class AdminReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async listReturns(query: AdminReturnsQueryDto) {
    const { page, limit, status, search, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { estado: status as EstadoDevolucion }),
      ...(dateFrom && { creadoEn: { gte: new Date(dateFrom) } }),
      ...(dateTo && { creadoEn: { lte: new Date(dateTo) } }),
      ...(search && {
        OR: [
          { numeroTicket: { contains: search, mode: 'insensitive' as const } },
          {
            pedido: {
              nombreCliente: { contains: search, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };

    const [returns, total] = await Promise.all([
      this.prisma.devolucion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true,
          numeroTicket: true,
          estado: true,
          totalReembolso: true,
          metodoEntrega: true,
          metodoReembolso: true,
          creadoEn: true,
          enviadaEn: true,
          pedido: { select: { numeroPedido: true, nombreCliente: true } },
          items: { select: { id: true } },
        },
      }),
      this.prisma.devolucion.count({ where }),
    ]);

    return {
      returns: returns.map((r) => ({
        ...r,
        totalReembolso: Number(r.totalReembolso ?? 0),
        itemCount: r.items.length,
        items: undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReturnDetail(returnId: string) {
    const devolucion = await this.prisma.devolucion.findUnique({
      where: { id: returnId },
      include: {
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            nombreCliente: true,
            fechaEntrega: true,
          },
        },
        items: {
          include: {
            pedidoItem: {
              select: {
                sku: true,
                nombreProducto: true,
                talla: true,
                color: true,
              },
            },
            evidencias: {
              select: {
                id: true,
                claveArchivo: true,
                tipoMime: true,
                tamanioBytes: true,
              },
            },
          },
        },
        historial: { orderBy: { creadoEn: 'asc' } },
      },
    });

    if (!devolucion) throw new NotFoundException('Devolución no encontrada');

    return {
      ...devolucion,
      totalReembolso: Number(devolucion.totalReembolso ?? 0),
      items: devolucion.items.map((item) => ({
        ...item,
        valorUnitario: Number(item.valorUnitario),
      })),
    };
  }

  async changeStatus(
    returnId: string,
    dto: UpdateReturnStatusDto,
    admin: AdminUser,
  ) {
    const devolucion = await this.prisma.devolucion.findUnique({
      where: { id: returnId },
      select: {
        id: true,
        estado: true,
        pedido: { select: { correoCliente: true } },
      },
    });

    if (!devolucion) throw new NotFoundException('Devolución no encontrada');

    const newStatus = dto.status as EstadoDevolucion;
    const allowed = VALID_TRANSITIONS[devolucion.estado] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityException(
        `Transición no permitida: ${devolucion.estado} → ${newStatus}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.devolucion.update({
        where: { id: returnId },
        data: { estado: newStatus, ...(dto.notes && { notas: dto.notes }) },
        select: { id: true, estado: true, numeroTicket: true },
      });

      await tx.historialEstado.create({
        data: {
          devolucionId: returnId,
          estadoAnterior: devolucion.estado,
          estadoNuevo: newStatus,
          cambiadoPor: admin.correo,
          notas: dto.notes,
        },
      });

      return result;
    });

    this.audit.log('RETURN_STATUS_CHANGED', admin.correo, {
      tipoRecurso: 'devolucion',
      idRecurso: returnId,
      metadata: { from: devolucion.estado, to: newStatus },
    });

    this.notifications.send('STATUS_UPDATED', {
      returnId,
      newStatus,
      email: devolucion.pedido.correoCliente,
    });

    return updated;
  }

  async getTimeline(returnId: string) {
    const historial = await this.prisma.historialEstado.findMany({
      where: { devolucionId: returnId },
      orderBy: { creadoEn: 'asc' },
    });

    if (!historial.length)
      throw new NotFoundException('Devolución no encontrada');

    return historial;
  }
}
