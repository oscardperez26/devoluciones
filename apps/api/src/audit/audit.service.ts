import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';

interface AuditContext {
  tipoRecurso?: string;
  idRecurso?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonObject;
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
          metadata: context?.metadata ?? undefined,
        },
      })
      .catch(() => {
        // fallos de auditoría no deben interrumpir el flujo principal
      });
  }
}
