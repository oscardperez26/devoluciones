import type { RolAdmin } from '@prisma/client';

export interface AdminJwtPayload {
  sub: string;
  correo: string;
  rol: RolAdmin;
  iss: string;
  iat: number;
  exp: number;
}
