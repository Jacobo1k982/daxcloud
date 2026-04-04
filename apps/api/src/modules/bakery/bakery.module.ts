import { Module } from '@nestjs/common';
import { BakeryService } from './bakery.service';
import { BakeryController } from './bakery.controller';

@Module({
  providers: [BakeryService],
  controllers: [BakeryController],
})
export class BakeryModule {}