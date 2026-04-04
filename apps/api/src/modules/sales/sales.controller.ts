import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.salesService.create(user.tenantId, user.sub, body);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesService.findAll(user.tenantId, {
      branchId,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('summary')
  getSummary(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.salesService.getSummary(user.tenantId, branchId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salesService.findOne(user.tenantId, id);
  }
}