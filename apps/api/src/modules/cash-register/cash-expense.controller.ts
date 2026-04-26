import { Controller, Post, Get, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard }      from '../auth/guards/jwt-auth.guard';
import { CurrentUser }       from '../../common/decorators/current-user.decorator';
import { CashExpenseService } from './cash-expense.service';

@UseGuards(JwtAuthGuard)
@Controller('cash-register/expenses')
export class CashExpenseController {
  constructor(private readonly service: CashExpenseService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: {
    branchId:    string;
    amount:      number;
    concept:     string;
    category:    string;
    supplier?:   string;
    notes?:      string;
    managerPin?: string;
  }) {
    return this.service.create(user.tenantId, user.sub, body);
  }

  @Get()
  findByShift(@CurrentUser() user: any, @Query('branchId') branchId: string) {
    return this.service.findByShift(user.tenantId, branchId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id, user.sub);
  }

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }
}
