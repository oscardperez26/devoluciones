import type { CarrierAddress, DraftItem, ReturnDraft, SubmittedReturn } from '@/types';
import { wizardClient } from './client';

export async function createOrUpdateDraft(items: DraftItem[]): Promise<ReturnDraft> {
  const res = await wizardClient.post<ReturnDraft>('/returns', { items });
  return res.data;
}

export async function setDeliveryStore(returnId: string, storeId: string): Promise<void> {
  await wizardClient.patch(`/returns/${returnId}/delivery`, { method: 'TIENDA', storeId });
}

export async function setDeliveryCarrier(returnId: string, address: CarrierAddress): Promise<void> {
  await wizardClient.patch(`/returns/${returnId}/delivery`, { method: 'TRANSPORTADORA', address });
}

export async function setRefundMethod(returnId: string, method: string): Promise<void> {
  await wizardClient.patch(`/returns/${returnId}/refund-method`, { method });
}

export async function submitReturn(returnId: string): Promise<SubmittedReturn> {
  const res = await wizardClient.post<SubmittedReturn>(`/returns/${returnId}/submit`);
  return res.data;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresAt: string;
}

export async function getUploadUrl(
  returnId: string,
  devolucionItemId: string,
  file: File,
): Promise<UploadUrlResponse> {
  const res = await wizardClient.post<UploadUrlResponse>(
    `/returns/${returnId}/evidences/upload-url`,
    { devolucionItemId, tipoMime: file.type, nombreArchivo: file.name },
  );
  return res.data;
}

export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
}

export async function confirmUpload(
  returnId: string,
  devolucionItemId: string,
  claveArchivo: string,
  file: File,
): Promise<void> {
  await wizardClient.post(`/returns/${returnId}/evidences/confirm`, {
    devolucionItemId,
    claveArchivo,
    tipoMime: file.type,
    tamanioBytes: file.size,
  });
}
