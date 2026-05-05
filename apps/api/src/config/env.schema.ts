import { z } from 'zod';

const envSchema = z
  .object({
    DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required.'),
    REDIS_URL: z.string().trim().min(1, 'REDIS_URL is required.'),
    RETURN_ACCESS_SECRET: z
      .string()
      .trim()
      .min(32, 'RETURN_ACCESS_SECRET debe tener al menos 32 caracteres.'),
    ADMIN_JWT_SECRET: z
      .string()
      .trim()
      .min(32, 'ADMIN_JWT_SECRET debe tener al menos 32 caracteres.'),
    S3_BUCKET: z.string().trim().min(1, 'S3_BUCKET is required.'),
    S3_REGION: z.string().trim().min(1, 'S3_REGION is required.'),
    S3_ACCESS_KEY_ID: z.string().trim().min(1, 'S3_ACCESS_KEY_ID is required.'),
    S3_SECRET_ACCESS_KEY: z
      .string()
      .trim()
      .min(1, 'S3_SECRET_ACCESS_KEY is required.'),
    S3_ENDPOINT: z.string().trim().optional(),
    RESEND_API_KEY: z.string().trim().min(1, 'RESEND_API_KEY is required.'),
    EMAIL_FROM: z.string().trim().min(1, 'EMAIL_FROM is required.'),
    PORT: z.coerce.number().int().positive().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    ALLOWED_ORIGINS: z.string().trim().optional(),
  })
  .passthrough();

export type Environment = z.infer<typeof envSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const parsedConfig = envSchema.safeParse(config);

  if (parsedConfig.success) {
    return parsedConfig.data;
  }

  const errors = parsedConfig.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid environment configuration: ${errors}`);
}
