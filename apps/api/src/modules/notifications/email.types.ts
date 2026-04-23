export type EmailType = 'RETURN_CONFIRMED' | 'STATUS_UPDATED' | 'BONO_EMITIDO';

export interface ReturnConfirmedPayload {
  returnId: string;
  ticketNumber: string;
  email: string;
  totalRefund: number;
}

export interface StatusUpdatedPayload {
  returnId: string;
  newStatus: string;
  email: string;
}

export interface BonoEmitidoPayload {
  returnId: string;
  ticketNumber: string;
  email: string;
  codigoBono: string;
  totalRefund: number;
}

export interface EmailPayloadMap {
  RETURN_CONFIRMED: ReturnConfirmedPayload;
  STATUS_UPDATED: StatusUpdatedPayload;
  BONO_EMITIDO: BonoEmitidoPayload;
}

export interface EmailJob<T extends EmailType = EmailType> {
  type: T;
  payload: EmailPayloadMap[T];
}
