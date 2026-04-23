import { z } from 'zod';

export const AdminReturnsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      'BORRADOR',
      'ENVIADA',
      'EN_REVISION',
      'APROBADA',
      'RECHAZADA',
      'PRODUCTO_RECIBIDO',
      'REEMBOLSO_EN_PROCESO',
      'COMPLETADA',
    ])
    .optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type AdminReturnsQueryDto = z.infer<typeof AdminReturnsQuerySchema>;
