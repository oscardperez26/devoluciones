import { Controller, Get, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  DepartmentQuerySchema,
  StoresQuerySchema,
  type DepartmentQueryDto,
  type StoresQueryDto,
} from './dto/stores-query.dto';
import { StoresService } from './stores.service';

@Controller({ path: 'stores', version: '1' })
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('departments')
  getDepartments() {
    return this.storesService.getDepartments();
  }

  @Get('cities')
  getCities(
    @Query(new ZodValidationPipe(DepartmentQuerySchema))
    query: DepartmentQueryDto,
  ) {
    return this.storesService.getCities(query.department);
  }

  @Get()
  getStores(
    @Query(new ZodValidationPipe(StoresQuerySchema)) query: StoresQueryDto,
  ) {
    return this.storesService.getStores(query.department, query.city);
  }
}
