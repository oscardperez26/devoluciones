import { Module } from '@nestjs/common';
import { ReturnAccessModule } from '../return-access/return-access.module';
import { ReturnRulesModule } from '../return-rules/return-rules.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { ReturnEligibilityService } from './return-eligibility/return-eligibility.service';

@Module({
  imports: [ReturnAccessModule, ReturnRulesModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, ReturnEligibilityService],
  exports: [ReturnEligibilityService],
})
export class OrdersModule {}
