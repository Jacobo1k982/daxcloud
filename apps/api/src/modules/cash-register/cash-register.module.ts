import { Module } from '@nestjs/common';
import { CashRegisterService }    from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { CashExpenseService }     from './cash-expense.service';
import { CashExpenseController }  from './cash-expense.controller';
import { PrismaModule }           from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [CashRegisterController, CashExpenseController],
  providers:   [CashRegisterService, CashExpenseService],
  exports:     [CashRegisterService, CashExpenseService],
})
export class CashRegisterModule {}