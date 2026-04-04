import { Module } from '@nestjs/common';
import { ProduceService } from './produce.service';
import { ProduceController } from './produce.controller';

@Module({
  providers: [ProduceService],
  controllers: [ProduceController],
})
export class ProduceModule {}