import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminUser,
  type AdminUser as IAdminUser,
} from '../../common/decorators/admin-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminReturnsService } from './admin-returns.service';
import {
  AdminReturnsQuerySchema,
  type AdminReturnsQueryDto,
} from './dto/admin-returns-query.dto';
import {
  UpdateReturnStatusSchema,
  type UpdateReturnStatusDto,
} from './dto/update-return-status.dto';

@Controller({ path: 'admin/returns', version: '1' })
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles('AGENTE')
export class AdminReturnsController {
  constructor(private readonly adminReturnsService: AdminReturnsService) {}

  @Get()
  listReturns(
    @Query(new ZodValidationPipe(AdminReturnsQuerySchema))
    query: AdminReturnsQueryDto,
  ) {
    return this.adminReturnsService.listReturns(query);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.adminReturnsService.getReturnDetail(id);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateReturnStatusSchema))
    dto: UpdateReturnStatusDto,
    @AdminUser() admin: IAdminUser,
  ) {
    return this.adminReturnsService.changeStatus(id, dto, admin);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.adminReturnsService.getTimeline(id);
  }
}
