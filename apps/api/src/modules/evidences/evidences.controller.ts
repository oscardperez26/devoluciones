import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
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
}
