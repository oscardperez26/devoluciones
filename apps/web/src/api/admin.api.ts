import type { AdminReturn, AdminReturnDetail, Pagination, StatusHistory } from '@/types';
import { adminClient } from './client';

export interface AdminLoginResponse {
  accessToken: string;
  expiresAt: string;
  user: { id: string; nombre: string; correo: string; rol: string };
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await adminClient.post<AdminLoginResponse>('/admin/auth/login', { email, password });
  return res.data;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminListResponse {
  returns: AdminReturn[];
  pagination: Pagination;
}

export async function listReturns(params: AdminListParams): Promise<AdminListResponse> {
  const res = await adminClient.get<AdminListResponse>('/admin/returns', { params });
  return res.data;
}

export async function getReturnDetail(id: string): Promise<AdminReturnDetail> {
  const res = await adminClient.get<AdminReturnDetail>(`/admin/returns/${id}`);
  return res.data;
}

export async function changeStatus(id: string, status: string, notes?: string): Promise<void> {
  await adminClient.patch(`/admin/returns/${id}/status`, { status, notes });
}

export async function getTimeline(id: string): Promise<StatusHistory[]> {
  const res = await adminClient.get<StatusHistory[]>(`/admin/returns/${id}/timeline`);
  return res.data;
}

export async function fetchEvidenceBlob(returnId: string, evidenceId: string): Promise<string> {
  const res = await adminClient.get(`/admin/returns/${returnId}/evidences/${evidenceId}/download`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data as Blob);
}

export interface ReturnRule {
  id: string;
  codigo: string;
  label: string;
  grupo: string;
  plazosDias: number;
  requiereEvidencia: boolean;
  activo: boolean;
  orden: number;
}

export async function listReturnRules(): Promise<ReturnRule[]> {
  const res = await adminClient.get<ReturnRule[]>('/admin/return-rules');
  return res.data;
}

export async function updateReturnRule(id: string, data: Partial<Omit<ReturnRule, 'id' | 'codigo'>>): Promise<ReturnRule> {
  const res = await adminClient.patch<ReturnRule>(`/admin/return-rules/${id}`, data);
  return res.data;
}

export async function createReturnRule(data: Omit<ReturnRule, 'id'>): Promise<ReturnRule> {
  const res = await adminClient.post<ReturnRule>('/admin/return-rules', data);
  return res.data;
}
