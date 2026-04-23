import { Injectable } from '@nestjs/common';
import { EstadoDevolucion } from '@prisma/client';
import {
  ACTIVE_STATUSES,
  REASONS,
  type EligibleReason,
  type ItemEligibility,
  type OrderContextForEligibility,
  type OrderItemForEligibility,
  type ReasonCode,
} from './return-eligibility.types';

@Injectable()
export class ReturnEligibilityService {
  getItemEligibility(
    item: OrderItemForEligibility,
    order: OrderContextForEligibility,
    today: Date = new Date(),
  ): ItemEligibility {
    if (!item.esDevolvible) {
      return {
        isReturnable: false,
        returnStatus: null,
        eligibleReasons: [],
        blockedReason: 'NOT_RETURNABLE',
      };
    }

    const activeReturn = item.devoluciones.find((d) =>
      (ACTIVE_STATUSES as ReadonlyArray<string>).includes(d.devolucion.estado),
    );
    if (activeReturn) {
      return {
        isReturnable: false,
        returnStatus: activeReturn.devolucion.estado,
        eligibleReasons: [],
        blockedReason: 'ACTIVE_RETURN',
      };
    }

    const completedReturn = item.devoluciones.find(
      (d) => d.devolucion.estado === EstadoDevolucion.COMPLETADA,
    );
    if (completedReturn) {
      return {
        isReturnable: false,
        returnStatus: EstadoDevolucion.COMPLETADA,
        eligibleReasons: [],
        blockedReason: 'ALREADY_REFUNDED',
      };
    }

    const referenceDate =
      order.fechaEntrega ??
      new Date(order.fechaCompra.getTime() + 7 * 24 * 60 * 60 * 1000);

    const daysSinceDelivery = Math.max(
      0,
      Math.floor(
        (today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const eligibleReasons: EligibleReason[] = [];
    for (const [code, reason] of Object.entries(REASONS) as [
      ReasonCode,
      (typeof REASONS)[ReasonCode],
    ][]) {
      const daysLeft = reason.deadlineDays - daysSinceDelivery;
      if (daysLeft > 0) {
        eligibleReasons.push({
          code,
          label: reason.label,
          requiresEvidence: reason.requiresEvidence,
          daysLeft,
        });
      }
    }

    return {
      isReturnable: true,
      returnStatus: null,
      eligibleReasons,
      blockedReason: null,
    };
  }
}
