import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getFullDashboard(user.tenantId, period);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getSummary(user.tenantId, period);
  }

  @Get('sales-by-period')
  getSalesByPeriod(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getSalesByPeriod(user.tenantId, period);
  }

  @Get('top-products')
  getTopProducts(@CurrentUser() user: any, @Query('period') period = 'month', @Query('limit') limit = '10') {
    return this.analyticsService.getTopProducts(user.tenantId, period, parseInt(limit));
  }

  @Get('branch-performance')
  getBranchPerformance(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getBranchPerformance(user.tenantId, period);
  }

  @Get('payment-methods')
  getPaymentMethods(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getPaymentMethods(user.tenantId, period);
  }

  @Get('peak-hours')
  getPeakHours(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getPeakHours(user.tenantId, period);
  }

  @Get('top-cashiers')
  getTopCashiers(@CurrentUser() user: any, @Query('period') period = 'month') {
    return this.analyticsService.getTopCashiers(user.tenantId, period);
  }

  @Get('critical-stock')
  getCriticalStock(@CurrentUser() user: any) {
    return this.analyticsService.getCriticalStock(user.tenantId);
  }
}