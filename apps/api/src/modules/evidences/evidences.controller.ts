import { Body, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  AccessContext,
  type AccessContext as IAccessContext,
} from '../../common/decorators/access-context.decorator';
import { ReturnAccessGuard } from '../return-access/return-access.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { EvidencesService } from './evidences.service';
import {
  ConfirmUploadSchema,
  type ConfirmUploadDto,
} from './dto/confirm-upload.dto';
import { UploadUrlSchema, type UploadUrlDto } from './dto/upload-url.dto';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller({ path: 'returns/:id/evidences', version: '1' })
@UseGuards(ReturnAccessGuard)
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @Post('upload-url')
  getUploadUrl(
    @Param('id') returnId: string,
    @Body(new ZodValidationPipe(UploadUrlSchema)) dto: UploadUrlDto,
    @AccessContext() ctx: IAccessContext,
  ) {
    return this.evidencesService.generateUploadUrl(returnId, dto, ctx);
  }

  @Post('confirm')
  confirmUpload(
    @Param('id') returnId: string,
    @Body(new ZodValidationPipe(ConfirmUploadSchema)) dto: ConfirmUploadDto,
    @AccessContext() ctx: IAccessContext,
  ) {
    return this.evidencesService.confirmUpload(returnId, dto, ctx);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) =>
          cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten imágenes JPEG, PNG o WebP'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadDirect(
    @Param('id') returnId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('devolucionItemId') devolucionItemId: string,
    @AccessContext() ctx: IAccessContext,
  ) {
    return this.evidencesService.confirmDirectUpload(
      returnId,
      devolucionItemId,
      file,
      ctx,
    );
  }
}
