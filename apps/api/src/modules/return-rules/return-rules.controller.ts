import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReturnRulesService } from './return-rules.service';
import { CreateRuleSchema, UpdateRuleSchema, type CreateRuleDto, type UpdateRuleDto } from './dto/return-rule.dto';

@Controller({ path: 'admin/return-rules', version: '1' })
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles('AGENTE')
export class ReturnRulesController {
  constructor(private readonly service: ReturnRulesService) {}

  @Get()
  listAll() {
    return this.service.listAll();
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateRuleSchema)) dto: CreateRuleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRuleSchema)) dto: UpdateRuleDto,
  ) {
    return this.service.update(id, dto);
  }
}
