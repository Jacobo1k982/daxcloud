import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard }     from '../auth/guards/jwt-auth.guard';
import { RolesGuard }       from '../auth/guards/roles.guard';
import { Roles }            from '../../common/decorators/roles.decorator';
import { CurrentUser }      from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getFullDashboard(user.tenantId, period, customStart, customEnd);
  }

  @Get('summary')
  getSummary(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getSummary(user.tenantId, period, customStart, customEnd);
  }

  @Get('sales-by-period')
  getSalesByPeriod(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getSalesByPeriod(user.tenantId, period, customStart, customEnd);
  }

  @Get('top-products')
  getTopProducts(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('limit')       limit       = '10',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getTopProducts(user.tenantId, period, parseInt(limit), customStart, customEnd);
  }

  @Get('sales-by-category')
  getSalesByCategory(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getSalesByCategory(user.tenantId, period, customStart, customEnd);
  }

  @Get('branch-performance')
  getBranchPerformance(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getBranchPerformance(user.tenantId, period, customStart, customEnd);
  }

  @Get('payment-methods')
  getPaymentMethods(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getPaymentMethods(user.tenantId, period, customStart, customEnd);
  }

  @Get('peak-hours')
  getPeakHours(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getPeakHours(user.tenantId, period, customStart, customEnd);
  }

  @Get('top-cashiers')
  getTopCashiers(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getTopCashiers(user.tenantId, period, 8, customStart, customEnd);
  }

  @Get('critical-stock')
  getCriticalStock(@CurrentUser() user: any) {
    return this.analyticsService.getCriticalStock(user.tenantId);
  }

  @Get('sales-report')
  getSalesReport(
    @CurrentUser() user: any,
    @Query('period')      period      = 'month',
    @Query('customStart') customStart?: string,
    @Query('customEnd')   customEnd?:  string,
  ) {
    return this.analyticsService.getSalesReport(user.tenantId, period, customStart, customEnd);
  }
}
