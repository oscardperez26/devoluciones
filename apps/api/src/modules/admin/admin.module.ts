import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminReturnsController } from './admin-returns.controller';
import { AdminReturnsService } from './admin-returns.service';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [AdminAuthController, AdminReturnsController],
  providers: [AdminAuthService, AdminReturnsService, AdminJwtGuard, RolesGuard],
})
export class AdminModule {}
