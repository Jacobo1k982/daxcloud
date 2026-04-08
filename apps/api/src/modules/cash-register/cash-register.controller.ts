import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { JwtAuthGuard }        from '../auth/guards/jwt-auth.guard';
import { CurrentUser }         from '../../common/decorators/current-user.decorator';
import { OpenShiftDto }        from './dto/open-shift.dto';
import { CloseShiftDto }       from './dto/close-shift.dto';

@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private cashRegisterService: CashRegisterService) {}

  // POST /cash-register/open
  @Post('open')
  openShift(@CurrentUser() user: any, @Body() dto: OpenShiftDto) {
    return this.cashRegisterService.openShift(user.tenantId, user.sub, dto);
  }

  // POST /cash-register/:id/close
  @Post(':id/close')
  closeShift(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.cashRegisterService.closeShift(user.tenantId, user.sub, id, dto);
  }

  // GET /cash-register/active?branchId=xxx
  @Get('active')
  getActive(@CurrentUser() user: any, @Query('branchId') branchId: string) {
    return this.cashRegisterService.getActiveShift(user.tenantId, branchId);
  }

  // GET /cash-register
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('branchId')  branchId?:  string,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:   string,
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
  ) {
    return this.cashRegisterService.findAll(user.tenantId, {
      branchId, startDate, endDate,
      page:  page  ? parseInt(page)  : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // GET /cash-register/:id
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cashRegisterService.findOne(user.tenantId, id);
  }
}
