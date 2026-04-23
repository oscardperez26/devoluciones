import type { EstadoDevolucion } from '@prisma/client';

export const REASONS = {
  SIZE_SMALL: {
    label: 'Demasiado pequeño',
    deadlineDays: 5,
    requiresEvidence: false,
  },
  SIZE_LARGE: {
    label: 'Demasiado grande',
    deadlineDays: 5,
    requiresEvidence: false,
  },
  NOT_EXPECTED: {
    label: 'No es lo que esperaba',
    deadlineDays: 5,
    requiresEvidence: false,
  },
  LATE_DELIVERY: {
    label: 'Retraso — ya no lo quiero',
    deadlineDays: 5,
    requiresEvidence: false,
  },
  WRONG_ITEM: {
    label: 'Se entregó artículo errado',
    deadlineDays: 5,
    requiresEvidence: true,
  },
  SEAM_DEFECT: {
    label: 'Defecto de costura',
    deadlineDays: 30,
    requiresEvidence: true,
  },
  SHRUNK: { label: 'Se encogió', deadlineDays: 30, requiresEvidence: true },
  COLOR_LOSS: {
    label: 'Perdió el color',
    deadlineDays: 30,
    requiresEvidence: true,
  },
} as const;

export type ReasonCode = keyof typeof REASONS;

export const ACTIVE_STATUSES = [
  'ENVIADA',
  'EN_REVISION',
  'APROBADA',
  'PRODUCTO_RECIBIDO',
  'REEMBOLSO_EN_PROCESO',
] as const satisfies ReadonlyArray<EstadoDevolucion>;

export interface EligibleReason {
  code: ReasonCode;
  label: string;
  requiresEvidence: boolean;
  daysLeft: number;
}

export type BlockedReason =
  | 'ACTIVE_RETURN'
  | 'ALREADY_REFUNDED'
  | 'NOT_RETURNABLE';

export interface ItemEligibility {
  isReturnable: boolean;
  returnStatus: string | null;
  eligibleReasons: EligibleReason[];
  blockedReason: BlockedReason | null;
}

export interface OrderItemForEligibility {
  esDevolvible: boolean;
  devoluciones: {
    devolucion: {
      id: string;
      estado: EstadoDevolucion;
    };
  }[];
}

export interface OrderContextForEligibility {
  fechaEntrega: Date | null;
  fechaCompra: Date;
}
