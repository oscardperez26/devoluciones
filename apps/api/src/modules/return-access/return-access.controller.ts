import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AccessResponseDto } from './dto/access-response.dto';
import { StartAccessSchema } from './dto/start-access.dto';
import type { StartAccessDto } from './dto/start-access.dto';
import { ReturnAccessService } from './return-access.service';

@Controller({ path: 'access', version: '1' })
export class ReturnAccessController {
  constructor(private readonly returnAccessService: ReturnAccessService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async start(
    @Body(new ZodValidationPipe(StartAccessSchema)) dto: StartAccessDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AccessResponseDto> {
    return this.returnAccessService.verifyAndIssue(
      dto,
      ip,
      req.headers['user-agent'],
    );
  }
}
