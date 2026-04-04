import { Module } from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { ClothingController } from './clothing.controller';

@Module({
  providers: [ClothingService],
  controllers: [ClothingController],
})
export class ClothingModule {}