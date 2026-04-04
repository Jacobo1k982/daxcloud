import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  providers: [ExportsService],
  controllers: [ExportsController],
})
export class ExportsModule {}