import { z } from 'zod';

export const StartAccessSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(1).max(50),
  email: z.string().trim().email(),
});

export type StartAccessDto = z.infer<typeof StartAccessSchema>;
