import { z } from 'zod';
import { ALLOWED_MIME_TYPES } from './upload-url.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ConfirmUploadSchema = z.object({
  devolucionItemId: z.string().uuid(),
  claveArchivo: z.string().min(1),
  tipoMime: z.enum(ALLOWED_MIME_TYPES),
  tamanioBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, 'El archivo supera el límite de 10 MB'),
});

export type ConfirmUploadDto = z.infer<typeof ConfirmUploadSchema>;
