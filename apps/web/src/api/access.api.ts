import { wizardClient } from './client';

export interface StartAccessResponse {
  sessionToken: string;
  expiresAt: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    purchasedAt: string;
    deliveredAt: string | null;
  };
}

export async function startSession(orderNumber: string, email: string): Promise<StartAccessResponse> {
  const res = await wizardClient.post<StartAccessResponse>('/access/start', { orderNumber, email });
  return res.data;
}
