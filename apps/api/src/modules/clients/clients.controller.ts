import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { RolesGuard }     from '../auth/guards/roles.guard';
import { Roles }          from '../../common/decorators/roles.decorator';
import { CurrentUser }    from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get('stats')
  @Roles('admin', 'manager')
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user.tenantId);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    return this.service.findAll(user.tenantId, {
      search,
      active: active !== undefined ? active === 'true' : undefined,
      page:   page  ? parseInt(page)  : 1,
      limit:  limit ? parseInt(limit) : 30,
    });
  }

  @Get('search-phone')
  findByPhone(@CurrentUser() user: any, @Query('phone') phone: string) {
    return this.service.findByPhone(user.tenantId, phone);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/sales')
  getSaleHistory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getSaleHistory(user.tenantId, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: {
    firstName:  string;
    lastName?:  string;
    phone?:     string;
    email?:     string;
    idNumber?:  string;
    birthDate?: string;
    notes?:     string;
  }) {
    return this.service.create(user.tenantId, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.update(user.tenantId, id, body);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

  @Post(':id/credit')
  @Roles('admin', 'manager')
  addCredit(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { amount: number; notes?: string },
  ) {
    return this.service.addCredit(user.tenantId, id, body.amount, body.notes);
  }

  @Post(':id/pay-credit')
  @Roles('admin', 'manager')
  payCredit(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.service.payCredit(user.tenantId, id, body.amount);
  }
}
