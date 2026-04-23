import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AccessContext } from '../../common/decorators/access-context.decorator';
import { RedisService } from '../../infrastructure/cache/redis.service';
import type { ReturnAccessPayload } from './interfaces/return-access-payload.interface';

@Injectable()
export class ReturnAccessGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { accessContext: AccessContext }>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    let payload: ReturnAccessPayload;
    try {
      payload = await this.jwt.verifyAsync<ReturnAccessPayload>(token, {
        secret: this.config.getOrThrow<string>('RETURN_ACCESS_SECRET'),
        issuer: 'returns-api',
      });
    } catch {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Sesión expirada o inválida',
      });
    }

    // Verificar revocación en Redis — si Redis no está disponible, el JWT es suficiente
    try {
      const exists = await this.redis.client.exists(`return:session:${payload.jti}`);
      if (exists === 0) {
        throw new UnauthorizedException({ code: 'SESSION_REVOKED', message: 'Sesión revocada' });
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      // Redis no disponible — continuar con validación JWT solamente
    }

    req.accessContext = {
      orderId: payload.orderId,
      emailHash: payload.emailHash,
      returnId: payload.returnId,
    };

    return true;
  }

  private extractToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
