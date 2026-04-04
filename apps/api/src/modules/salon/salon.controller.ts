import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalonService } from './salon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salon')
export class SalonController {
  constructor(private salonService: SalonService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.salonService.getStats(user.tenantId);
  }

  // ── Empleados ──
  @Get('employees')
  findAllEmployees(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.salonService.findAllEmployees(user.tenantId, branchId);
  }

  @Roles('admin', 'manager')
  @Post('employees')
  createEmployee(@CurrentUser() user: any, @Body() body: any) {
    return this.salonService.createEmployee(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('employees/:id')
  updateEmployee(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.salonService.updateEmployee(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Delete('employees/:id')
  deleteEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salonService.deleteEmployee(user.tenantId, id);
  }

  // ── Servicios ──
  @Get('services')
  findAllServices(@CurrentUser() user: any) {
    return this.salonService.findAllServices(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('services')
  createService(@CurrentUser() user: any, @Body() body: any) {
    return this.salonService.createService(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('services/:id')
  updateService(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.salonService.updateService(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Delete('services/:id')
  deleteService(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salonService.deleteService(user.tenantId, id);
  }

  // ── Citas ──
  @Get('appointments')
  findAllAppointments(
    @CurrentUser() user: any,
    @Query('date') date?: string,
    @Query('employeeId') employeeId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salonService.findAllAppointments(user.tenantId, date, employeeId, branchId);
  }

  @Get('appointments/range')
  findByRange(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.salonService.findAppointmentsByRange(user.tenantId, startDate, endDate, employeeId);
  }

  @Post('appointments')
  createAppointment(@CurrentUser() user: any, @Body() body: any) {
    return this.salonService.createAppointment(user.tenantId, body);
  }

  @Put('appointments/:id')
  updateAppointment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.salonService.updateAppointment(user.tenantId, id, body);
  }

  @Put('appointments/:id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.salonService.updateAppointmentStatus(user.tenantId, id, body.status);
  }

  // ── Clientes ──
  @Get('clients')
  findAllClients(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.salonService.findAllClients(user.tenantId, search);
  }

  @Post('clients')
  createClient(@CurrentUser() user: any, @Body() body: any) {
    return this.salonService.createClient(user.tenantId, body);
  }
}