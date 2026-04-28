import type { EstadoDevolucion } from '../../../common/types/prisma-enums';

export const REASONS = {
  SIZE_SMALL:   { label: 'Demasiado pequeño',                      deadlineDays: 5,  requiresEvidence: false, grupo: 'Talla y expectativa' },
  SIZE_LARGE:   { label: 'Demasiado grande',                       deadlineDays: 5,  requiresEvidence: false, grupo: 'Talla y expectativa' },
  NOT_EXPECTED: { label: 'No es lo que esperaba',                  deadlineDays: 5,  requiresEvidence: false, grupo: 'Talla y expectativa' },
  LATE_DELIVERY:{ label: 'Retraso en la entrega — ya no lo quiero',deadlineDays: 5,  requiresEvidence: false, grupo: 'Entrega y despacho'   },
  WRONG_ITEM:   { label: 'Se entregó artículo errado',             deadlineDays: 5,  requiresEvidence: true,  grupo: 'Entrega y despacho'   },
  SEAM_DEFECT:  { label: 'Defecto de costura',                     deadlineDays: 30, requiresEvidence: true,  grupo: 'Calidad del producto' },
  SHRUNK:       { label: 'Se encogió',                             deadlineDays: 30, requiresEvidence: true,  grupo: 'Calidad del producto' },
  COLOR_LOSS:   { label: 'Perdió el color',                        deadlineDays: 30, requiresEvidence: true,  grupo: 'Calidad del producto' },
} as const;

export type ReasonCode = keyof typeof REASONS;

export const ACTIVE_STATUSES: ReadonlyArray<EstadoDevolucion> = [
  'ENVIADA',
  'EN_REVISION',
  'APROBADA',
  'PRODUCTO_RECIBIDO',
  'REEMBOLSO_EN_PROCESO',
];

export interface EligibleReason {
  code: string;
  label: string;
  requiresEvidence: boolean;
  daysLeft: number;
  grupo: string;
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
  blockingReturnId: string | null;
}

export interface OrderItemForEligibility {
  esDevolvible: boolean;
  devoluciones: {
    devolucion: {
      id: string;
      estado: string;
    };
  }[];
}

export interface OrderContextForEligibility {
  fechaEntrega: Date | null;
  fechaCompra: Date;
}

export interface ActiveRule {
  codigo: string;
  label: string;
  grupo: string;
  plazosDias: number;
  requiereEvidencia: boolean;
}
