import { z } from 'zod';

const VALID_REASON_CODES = [
  'SIZE_SMALL',
  'SIZE_LARGE',
  'NOT_EXPECTED',
  'LATE_DELIVERY',
  'WRONG_ITEM',
  'SEAM_DEFECT',
  'SHRUNK',
  'COLOR_LOSS',
] as const;

export const CreateReturnSchema = z.object({
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        reasonCodes: z
          .array(z.enum(VALID_REASON_CODES))
          .min(1, 'Al menos una causal es requerida')
          .max(3, 'Máximo 3 causales por ítem'),
        comments: z.string().max(500).optional(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .min(1, 'Al menos un ítem es requerido'),
});

export type CreateReturnDto = z.infer<typeof CreateReturnSchema>;
