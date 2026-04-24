import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ReturnRulesController } from './return-rules.controller';
import { ReturnRulesService } from './return-rules.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ReturnRulesController],
  providers: [ReturnRulesService, AdminJwtGuard, RolesGuard],
  exports: [ReturnRulesService],
})
export class ReturnRulesModule {}
