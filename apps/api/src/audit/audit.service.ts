import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

interface AuditContext {
  tipoRecurso?: string;
  idRecurso?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(accion: string, actor: string, context?: AuditContext): void {
    this.prisma.auditoria
      .create({
        data: {
          accion,
          actor,
          tipoRecurso: context?.tipoRecurso,
          idRecurso: context?.idRecurso,
          ip: context?.ip,
          userAgent: context?.userAgent,
          metadata: context?.metadata ? JSON.stringify(context.metadata) : null,
        },
      })
      .catch(() => {
        // fallos de auditoría no deben interrumpir el flujo principal
      });
  }
}
