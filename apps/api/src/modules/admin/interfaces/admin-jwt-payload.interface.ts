import type { RolAdmin } from '../../../common/types/prisma-enums';

export interface AdminJwtPayload {
  sub: string;
  correo: string;
  rol: RolAdmin;
  iss: string;
  iat: number;
  exp: number;
}
