import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const UploadUrlSchema = z.object({
  devolucionItemId: z.string().uuid(),
  tipoMime: z.enum(ALLOWED_MIME_TYPES),
  nombreArchivo: z.string().min(1).max(255),
});

export type UploadUrlDto = z.infer<typeof UploadUrlSchema>;
