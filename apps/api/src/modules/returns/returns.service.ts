import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EstadoDevolucion, TipoEntrega, TipoReembolso } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import type { AccessContext } from '../../common/decorators/access-context.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { REASONS } from '../orders/return-eligibility/return-eligibility.types';
import { ReturnEligibilityService } from '../orders/return-eligibility/return-eligibility.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateReturnDto } from './dto/create-return.dto';
import type { SetDeliveryDto } from './dto/set-delivery.dto';
import type { SetRefundMethodDto } from './dto/set-refund-method.dto';
import { type ReturnItemInput, ReturnsRepository } from './returns.repository';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly returnsRepository: ReturnsRepository,
    private readonly eligibilityService: ReturnEligibilityService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async createOrUpdateDraft(ctx: AccessContext, dto: CreateReturnDto) {
    const orderItemIds = dto.items.map((i) => i.orderItemId);

    const pedido = await this.prisma.pedido.findUnique({
      where: { id: ctx.orderId },
      select: {
        id: true,
        fechaEntrega: true,
        fechaCompra: true,
        items: {
          where: { id: { in: orderItemIds } },
          select: {
            id: true,
            precioUnitario: true,
            esDevolvible: true,
            devoluciones: {
              select: { devolucion: { select: { id: true, estado: true } } },
            },
          },
        },
      },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const itemMap = new Map(pedido.items.map((i) => [i.id, i]));

    for (const dtoItem of dto.items) {
      if (!itemMap.has(dtoItem.orderItemId)) {
        throw new BadRequestException(
          `El ítem ${dtoItem.orderItemId} no pertenece a este pedido`,
        );
      }
    }

    const orderContext = {
      fechaEntrega: pedido.fechaEntrega,
      fechaCompra: pedido.fechaCompra,
    };
    const today = new Date();
    const itemsToCreate: ReturnItemInput[] = [];

    for (const dtoItem of dto.items) {
      const orderItem = itemMap.get(dtoItem.orderItemId)!;
      const eligibility = this.eligibilityService.getItemEligibility(
        orderItem,
        orderContext,
        today,
      );

      if (!eligibility.isReturnable) {
        throw new UnprocessableEntityException(
          `Ítem ${dtoItem.orderItemId} no elegible: ${eligibility.blockedReason ?? ''}`,
        );
      }

      const eligibleCodes = new Set(
        eligibility.eligibleReasons.map((r) => r.code),
      );
      for (const code of dtoItem.reasonCodes) {
        if (!eligibleCodes.has(code)) {
          throw new UnprocessableEntityException(
            `Causal ${code} no disponible para ítem ${dtoItem.orderItemId}`,
          );
        }
      }

      itemsToCreate.push({
        pedidoItemId: dtoItem.orderItemId,
        causales: dtoItem.reasonCodes,
        comentarios: dtoItem.comments,
        cantidad: dtoItem.quantity,
        valorUnitario: Number(orderItem.precioUnitario),
      });
    }

    const result = await this.returnsRepository.upsertDraft(
      ctx.orderId,
      ctx.emailHash,
      itemsToCreate,
    );

    this.audit.log('RETURN_DRAFT_UPSERTED', `order:${ctx.orderId}`, {
      tipoRecurso: 'devolucion',
      idRecurso: result.devolucionId,
    });

    return {
      returnId: result.devolucionId,
      status: 'DRAFT',
      totalRefund: result.totalReembolso,
      items: result.items.map((item) => ({
        id: item.id,
        requiresEvidence: item.causales.some(
          (c) => REASONS[c as keyof typeof REASONS]?.requiresEvidence,
        ),
        unitRefund: Number(item.valorUnitario),
      })),
    };
  }

  async setDeliveryMethod(
    returnId: string,
    ctx: AccessContext,
    dto: SetDeliveryDto,
  ) {
    await this.findOwnedDraft(returnId, ctx.orderId);

    const address =
      dto.method === 'TRANSPORTADORA'
        ? (dto.address as unknown as Prisma.InputJsonObject)
        : undefined;

    const updated = await this.returnsRepository.updateDelivery(
      returnId,
      dto.method as TipoEntrega,
      dto.method === 'TIENDA' ? dto.storeId : undefined,
      address,
    );

    this.audit.log('RETURN_DELIVERY_SET', `order:${ctx.orderId}`, {
      tipoRecurso: 'devolucion',
      idRecurso: returnId,
      metadata: { method: dto.method },
    });

    return { returnId: updated.id, deliveryMethod: updated.metodoEntrega };
  }

  async setRefundMethod(
    returnId: string,
    ctx: AccessContext,
    dto: SetRefundMethodDto,
  ) {
    await this.findOwnedDraft(returnId, ctx.orderId);

    const updated = await this.returnsRepository.updateRefundMethod(
      returnId,
      dto.method as TipoReembolso,
    );

    this.audit.log('RETURN_REFUND_SET', `order:${ctx.orderId}`, {
      tipoRecurso: 'devolucion',
      idRecurso: returnId,
      metadata: { method: dto.method },
    });

    return { returnId: updated.id, refundMethod: updated.metodoReembolso };
  }

  async submit(returnId: string, ctx: AccessContext) {
    const devolucion = await this.findOwnedDraft(returnId, ctx.orderId);

    if (!devolucion.metodoEntrega) {
      throw new UnprocessableEntityException('Falta el método de entrega');
    }
    if (!devolucion.metodoReembolso) {
      throw new UnprocessableEntityException('Falta el método de reembolso');
    }
    if (!devolucion.items.length) {
      throw new UnprocessableEntityException('La devolución no tiene ítems');
    }

    const submitted = await this.returnsRepository.submitReturn(returnId);

    this.audit.log('RETURN_SUBMITTED', `order:${ctx.orderId}`, {
      tipoRecurso: 'devolucion',
      idRecurso: returnId,
      metadata: { ticketNumber: submitted.numeroTicket as string },
    });

    this.notifications.send('RETURN_CONFIRMED', {
      returnId,
      ticketNumber: submitted.numeroTicket ?? '',
      email: submitted.pedido.correoCliente,
      totalRefund: Number(submitted.totalReembolso),
    });

    return {
      ticketNumber: submitted.numeroTicket,
      status: 'SUBMITTED',
      totalRefund: Number(submitted.totalReembolso ?? 0),
      confirmationEmail: this.maskEmail(submitted.pedido.correoCliente),
      estimatedReviewDays: 3,
    };
  }

  private async findOwnedDraft(returnId: string, orderId: string) {
    const devolucion = await this.returnsRepository.findByIdAndOrderId(
      returnId,
      orderId,
    );

    if (!devolucion) throw new NotFoundException('Devolución no encontrada');

    if (devolucion.estado !== EstadoDevolucion.BORRADOR) {
      throw new UnprocessableEntityException(
        `La devolución ya fue enviada (estado: ${devolucion.estado})`,
      );
    }

    return devolucion;
  }

  private maskEmail(email: string): string {
    const at = email.indexOf('@');
    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    return `${local.slice(0, Math.min(3, local.length))}***@${domain}`;
  }
}
