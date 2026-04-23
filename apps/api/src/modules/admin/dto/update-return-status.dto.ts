import { z } from 'zod';

export const UpdateReturnStatusSchema = z.object({
  status: z.enum([
    'EN_REVISION',
    'APROBADA',
    'RECHAZADA',
    'PRODUCTO_RECIBIDO',
    'REEMBOLSO_EN_PROCESO',
    'COMPLETADA',
  ]),
  notes: z.string().max(1000).optional(),
});

export type UpdateReturnStatusDto = z.infer<typeof UpdateReturnStatusSchema>;
