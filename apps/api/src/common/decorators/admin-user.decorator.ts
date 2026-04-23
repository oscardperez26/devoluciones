import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RolAdmin } from '@prisma/client';
import type { Request } from 'express';

export interface AdminUser {
  id: string;
  correo: string;
  rol: RolAdmin;
}

export const AdminUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { adminUser: AdminUser }>();
    return req.adminUser;
  },
);
