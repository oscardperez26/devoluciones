import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { ReturnAccessModule } from '../return-access/return-access.module';
import { ReturnsController } from './returns.controller';
import { ReturnsRepository } from './returns.repository';
import { ReturnsService } from './returns.service';

@Module({
  imports: [ReturnAccessModule, OrdersModule, NotificationsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService, ReturnsRepository],
})
export class ReturnsModule {}
