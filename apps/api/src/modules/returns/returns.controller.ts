import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AccessContext,
  type AccessContext as IAccessContext,
} from '../../common/decorators/access-context.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReturnAccessGuard } from '../return-access/return-access.guard';
import {
  CreateReturnSchema,
  type CreateReturnDto,
} from './dto/create-return.dto';
import { SetDeliverySchema, type SetDeliveryDto } from './dto/set-delivery.dto';
import {
  SetRefundMethodSchema,
  type SetRefundMethodDto,
} from './dto/set-refund-method.dto';
import { ReturnsService } from './returns.service';

@Controller({ path: 'returns', version: '1' })
@UseGuards(ReturnAccessGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrUpdateDraft(
    @Body(new ZodValidationPipe(CreateReturnSchema)) dto: CreateReturnDto,
    @AccessContext() ctx: IAccessContext,
  ) {
    return this.returnsService.createOrUpdateDraft(ctx, dto);
  }

  @Patch(':id/delivery')
  setDelivery(
    @Param('id') returnId: string,
    @Body(new ZodValidationPipe(SetDeliverySchema)) dto: SetDeliveryDto,
    @AccessContext() ctx: IAccessContext,
  ) {
    return this.returnsService.setDeliveryMethod(returnId, ctx, dto);
  }

  @Patch(':id/refund-method')
  setRefundMethod(
    @Param('id') returnId: string,
    @Body(new ZodValidationPipe(SetRefundMethodSchema)) dto: SetRefundMethodDto,
    @AccessContext() ctx: IAccessContext,
  ) {
    return this.returnsService.setRefundMethod(returnId, ctx, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(@Param('id') returnId: string, @AccessContext() ctx: IAccessContext) {
    return this.returnsService.submit(returnId, ctx);
  }
}
