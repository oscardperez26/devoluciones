import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { AccessContext } from '../../common/decorators/access-context.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { S3Service } from '../../infrastructure/storage/s3.service';
import type { ConfirmUploadDto } from './dto/confirm-upload.dto';
import type { UploadUrlDto } from './dto/upload-url.dto';

const MAX_EVIDENCES_PER_ITEM = 5;
const UPLOAD_URL_TTL = 900; // 15 minutos

@Injectable()
export class EvidencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async generateUploadUrl(
    returnId: string,
    dto: UploadUrlDto,
    ctx: AccessContext,
  ) {
    await this.verifyReturnOwnership(returnId, ctx.orderId);
    await this.verifyItemBelongsToReturn(dto.devolucionItemId, returnId);
    await this.checkEvidenceLimit(dto.devolucionItemId);

    const ext = this.getExtension(dto.tipoMime);
    const fileKey = `ev/${returnId}/${uuidv4()}.${ext}`;
    const uploadUrl = await this.s3.generateUploadUrl(
      fileKey,
      dto.tipoMime,
      UPLOAD_URL_TTL,
    );

    return {
      uploadUrl,
      fileKey,
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL * 1000).toISOString(),
    };
  }

  async confirmUpload(
    returnId: string,
    dto: ConfirmUploadDto,
    ctx: AccessContext,
  ) {
    await this.verifyReturnOwnership(returnId, ctx.orderId);
    await this.verifyItemBelongsToReturn(dto.devolucionItemId, returnId);
    await this.checkEvidenceLimit(dto.devolucionItemId);

    // claveArchivo must be scoped to this return
    if (!dto.claveArchivo.startsWith(`ev/${returnId}/`)) {
      throw new BadRequestException(
        'La clave del archivo no corresponde a esta devolución',
      );
    }

    const evidencia = await this.prisma.evidencia.create({
      data: {
        devolucionItemId: dto.devolucionItemId,
        claveArchivo: dto.claveArchivo,
        bucket: this.s3.getBucket(),
        tipoMime: dto.tipoMime,
        tamanioBytes: dto.tamanioBytes,
      },
    });

    return evidencia;
  }

  private async verifyReturnOwnership(
    returnId: string,
    orderId: string,
  ): Promise<void> {
    const devolucion = await this.prisma.devolucion.findFirst({
      where: { id: returnId, pedidoId: orderId, estado: 'BORRADOR' },
      select: { id: true },
    });
    if (!devolucion) {
      throw new NotFoundException(
        'Devolución no encontrada o no está en borrador',
      );
    }
  }

  private async verifyItemBelongsToReturn(
    itemId: string,
    returnId: string,
  ): Promise<void> {
    const item = await this.prisma.devolucionItem.findFirst({
      where: { id: itemId, devolucionId: returnId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('El ítem no pertenece a esta devolución');
    }
  }

  private async checkEvidenceLimit(devolucionItemId: string): Promise<void> {
    const count = await this.prisma.evidencia.count({
      where: { devolucionItemId, esValido: true },
    });
    if (count >= MAX_EVIDENCES_PER_ITEM) {
      throw new UnprocessableEntityException(
        `Se alcanzó el máximo de ${MAX_EVIDENCES_PER_ITEM} evidencias por ítem`,
      );
    }
  }

  async confirmDirectUpload(
    returnId: string,
    devolucionItemId: string,
    file: Express.Multer.File,
    ctx: AccessContext,
  ) {
    await this.verifyReturnOwnership(returnId, ctx.orderId);
    await this.verifyItemBelongsToReturn(devolucionItemId, returnId);
    await this.checkEvidenceLimit(devolucionItemId);

    const evidencia = await this.prisma.evidencia.create({
      data: {
        devolucionItemId,
        claveArchivo: `uploads/${file.filename}`,
        bucket: 'local',
        tipoMime: file.mimetype,
        tamanioBytes: file.size,
      },
    });

    return { id: evidencia.id };
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mimeType] ?? 'bin';
  }
}
