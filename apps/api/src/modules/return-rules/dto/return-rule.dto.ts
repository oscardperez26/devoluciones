import { z } from 'zod';

export const CreateRuleSchema = z.object({
  codigo: z
    .string()
    .min(1)
    .max(50)
    .toUpperCase()
    .regex(/^[A-Z0-9_]+$/, 'Solo letras mayúsculas, números y guión bajo'),
  label: z.string().min(1).max(150),
  grupo: z.string().min(1).max(80),
  plazosDias: z.number().int().min(1).max(365),
  requiereEvidencia: z.boolean().default(false),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0).default(0),
});
export type CreateRuleDto = z.infer<typeof CreateRuleSchema>;

export const UpdateRuleSchema = z.object({
  label: z.string().min(1).max(150).optional(),
  grupo: z.string().min(1).max(80).optional(),
  plazosDias: z.number().int().min(1).max(365).optional(),
  requiereEvidencia: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});
export type UpdateRuleDto = z.infer<typeof UpdateRuleSchema>;
