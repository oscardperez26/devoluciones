import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RolAdmin } from '@prisma/client';
import type { Request } from 'express';
import type { AdminUser } from '../decorators/admin-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<RolAdmin, number> = {
  AGENTE: 1,
  SUPERVISOR: 2,
  ADMIN: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RolAdmin[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const { adminUser } = context
      .switchToHttp()
      .getRequest<Request & { adminUser: AdminUser }>();

    const userLevel = ROLE_HIERARCHY[adminUser.rol] ?? 0;
    const minRequired = Math.min(...required.map((r) => ROLE_HIERARCHY[r]));

    if (userLevel < minRequired) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}
