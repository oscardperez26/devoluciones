import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReturnAccessController } from './return-access.controller';
import { ReturnAccessGuard } from './return-access.guard';
import { ReturnAccessService } from './return-access.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReturnAccessController],
  providers: [ReturnAccessService, ReturnAccessGuard],
  exports: [ReturnAccessGuard, JwtModule],
})
export class ReturnAccessModule {}
