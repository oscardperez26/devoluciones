import { z } from 'zod';

export const DepartmentQuerySchema = z.object({
  department: z.string().min(1),
});
export type DepartmentQueryDto = z.infer<typeof DepartmentQuerySchema>;

export const StoresQuerySchema = z.object({
  department: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
});
export type StoresQueryDto = z.infer<typeof StoresQuerySchema>;
