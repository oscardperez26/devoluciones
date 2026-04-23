import type { OrderWithItems } from '@/types';
import { wizardClient } from './client';

export async function getSessionOrder(): Promise<OrderWithItems> {
  const res = await wizardClient.get<OrderWithItems>('/session/order');
  return res.data;
}
