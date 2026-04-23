import { Module } from '@nestjs/common';
import { S3Service } from '../../infrastructure/storage/s3.service';
import { ReturnAccessModule } from '../return-access/return-access.module';
import { EvidencesController } from './evidences.controller';
import { EvidencesService } from './evidences.service';

@Module({
  imports: [ReturnAccessModule],
  controllers: [EvidencesController],
  providers: [EvidencesService, S3Service],
})
export class EvidencesModule {}
