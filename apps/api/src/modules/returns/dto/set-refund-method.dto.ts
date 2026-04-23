import { z } from 'zod';

export const SetRefundMethodSchema = z.object({
  method: z.enum(['TARJETA_REGALO', 'MERCADOPAGO', 'MEDIO_ORIGINAL']),
});

export type SetRefundMethodDto = z.infer<typeof SetRefundMethodSchema>;
