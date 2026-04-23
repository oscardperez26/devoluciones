import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  AccessContext,
  type AccessContext as IAccessContext,
} from '../../common/decorators/access-context.decorator';
import { ReturnAccessGuard } from '../return-access/return-access.guard';
import { OrdersService } from './orders.service';

@Controller({ path: 'session', version: '1' })
@UseGuards(ReturnAccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('order')
  getOrder(@AccessContext() ctx: IAccessContext) {
    return this.ordersService.getOrderWithEligibility(ctx.orderId);
  }
}
