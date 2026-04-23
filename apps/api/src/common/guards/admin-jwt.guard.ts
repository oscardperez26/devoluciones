import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AdminUser } from '../decorators/admin-user.decorator';
import type { AdminJwtPayload } from '../../modules/admin/interfaces/admin-jwt-payload.interface';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { adminUser: AdminUser }>();

    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Token de administrador no proporcionado',
      );
    }

    let payload: AdminJwtPayload;
    try {
      payload = await this.jwt.verifyAsync<AdminJwtPayload>(token, {
        secret: this.config.getOrThrow<string>('ADMIN_JWT_SECRET'),
        issuer: 'returns-admin',
      });
    } catch {
      throw new UnauthorizedException(
        'Token de administrador inválido o expirado',
      );
    }

    req.adminUser = {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
    };

    return true;
  }
}
