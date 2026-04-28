import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EstadoDevolucion, EstadoPedido } from '../../common/types/prisma-enums';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/audit.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AccessResponseDto } from './dto/access-response.dto';
import type { StartAccessDto } from './dto/start-access.dto';

const SESSION_TTL = 7200;
const IP_LIMIT = 5;
const ORDER_LIMIT = 3;
const RATE_WINDOW = 900;

@Injectable()
export class ReturnAccessService {
  private readonly logger = new Logger(ReturnAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async verifyAndIssue(
    dto: StartAccessDto,
    ip: string,
    userAgent?: string,
  ): Promise<AccessResponseDto> {
    // Rate limiting es opcional — si Redis no está disponible, se omite
    await this.checkRateLimits(ip, dto.orderNumber).catch(() => {
      this.logger.warn('Rate limiting omitido — Redis no disponible');
    });

    const emailNorm = dto.email.toLowerCase().trim();
    const emailHash = createHash('sha256').update(emailNorm).digest('hex');

    const pedido = await this.prisma.pedido.findFirst({
      where: { numeroPedido: dto.orderNumber, correoClienteHash: emailHash },
      select: {
        id: true,
        numeroPedido: true,
        nombreCliente: true,
        estado: true,
        fechaEntrega: true,
      },
    });

    if (!pedido) {
      this.audit.log('SESSION_FAILED', `ip:${ip}`, {
        ip,
        userAgent,
        metadata: { orderNumber: dto.orderNumber },
      });
      throw new NotFoundException(
        'No encontramos un pedido con ese número y correo.',
      );
    }

    if (pedido.estado === EstadoPedido.CANCELADO) {
      throw new UnprocessableEntityException(
        'El pedido está cancelado y no acepta devoluciones.',
      );
    }

    if (pedido.estado !== EstadoPedido.ENTREGADO) {
      throw new UnprocessableEntityException(
        'El pedido aún no ha sido entregado.',
      );
    }

    const borrador = await this.prisma.devolucion.findFirst({
      where: { pedidoId: pedido.id, estado: EstadoDevolucion.BORRADOR },
      select: { id: true },
    });

    const jti = uuidv4();
    const secret = this.config.getOrThrow<string>('RETURN_ACCESS_SECRET');

    const sessionToken = await this.jwt.signAsync(
      {
        orderId: pedido.id,
        emailHash,
        scope: 'return:write',
        returnId: borrador?.id ?? null,
      },
      {
        secret,
        issuer: 'returns-api',
        subject: `order:${pedido.id}`,
        jwtid: jti,
        expiresIn: SESSION_TTL,
      },
    );

    // Almacenamiento en Redis es opcional — el JWT sigue siendo válido sin él
    this.redis.client
      .set(`return:session:${jti}`, '1', 'EX', SESSION_TTL)
      .catch(() => {});

    this.audit.log('SESSION_STARTED', `order:${pedido.id}`, {
      tipoRecurso: 'pedido',
      idRecurso: pedido.id,
      ip,
      userAgent,
    });

    return {
      sessionToken,
      expiresAt: new Date(Date.now() + SESSION_TTL * 1000).toISOString(),
      order: {
        id: pedido.id,
        orderNumber: pedido.numeroPedido,
        customerName: pedido.nombreCliente,
        deliveredAt: pedido.fechaEntrega?.toISOString() ?? null,
      },
    };
  }

  async revokeSession(jti: string): Promise<void> {
    await this.redis.client.del(`return:session:${jti}`).catch(() => {});
  }

  private async checkRateLimits(ip: string, orderNumber: string): Promise<void> {
    const ipKey = `ratelimit:ip:${createHash('sha256').update(ip).digest('hex')}`;
    const orderKey = `ratelimit:order:${createHash('sha256').update(orderNumber).digest('hex')}`;

    const [ipCount, orderCount] = await Promise.all([
      this.increment(ipKey),
      this.increment(orderKey),
    ]);

    if (ipCount > IP_LIMIT || orderCount > ORDER_LIMIT) {
      throw new HttpException(
        {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async increment(key: string): Promise<number> {
    const count = await this.redis.client.incr(key);
    if (count === 1) await this.redis.client.expire(key, RATE_WINDOW);
    return count;
  }
}
