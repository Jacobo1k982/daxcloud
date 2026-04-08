import { Module } from '@nestjs/common';
import { CashRegisterService }    from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { PrismaModule }           from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [CashRegisterController],
  providers:   [CashRegisterService],
  exports:     [CashRegisterService],   // exportado para que SalesModule lo use
})
export class CashRegisterModule {}
