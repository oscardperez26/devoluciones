import { SetMetadata } from '@nestjs/common';
import type { RolAdmin } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolAdmin[]) => SetMetadata(ROLES_KEY, roles);
