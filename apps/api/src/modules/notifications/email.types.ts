export type EmailType = 'RETURN_CONFIRMED' | 'STATUS_UPDATED';

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

export interface EmailPayloadMap {
  RETURN_CONFIRMED: ReturnConfirmedPayload;
  STATUS_UPDATED: StatusUpdatedPayload;
}

export interface EmailJob<T extends EmailType = EmailType> {
  type: T;
  payload: EmailPayloadMap[T];
}
