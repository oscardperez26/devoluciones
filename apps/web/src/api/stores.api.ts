import type { Store } from '@/types';
import { wizardClient } from './client';

export async function getDepartments(): Promise<string[]> {
  const res = await wizardClient.get<string[]>('/stores/departments');
  return res.data;
}

export async function getCities(department: string): Promise<string[]> {
  const res = await wizardClient.get<string[]>('/stores/cities', { params: { department } });
  return res.data;
}

export async function getStores(department: string, city: string): Promise<Store[]> {
  const res = await wizardClient.get<Store[]>('/stores', { params: { department, city } });
  return res.data;
}
