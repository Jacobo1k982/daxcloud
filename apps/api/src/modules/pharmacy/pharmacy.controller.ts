import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pharmacy')
export class PharmacyController {
  constructor(private pharmacyService: PharmacyService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.pharmacyService.getStats(user.tenantId);
  }

  // ── Lotes ──
  @Get('lots')
  findAllLots(@CurrentUser() user: any, @Query('branchId') branchId?: string, @Query('productId') productId?: string) {
    return this.pharmacyService.findAllLots(user.tenantId, branchId, productId);
  }

  @Get('lots/expiring')
  getExpiringLots(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.pharmacyService.getExpiringLots(user.tenantId, days ? parseInt(days) : 30);
  }

  @Get('lots/expired')
  getExpiredLots(@CurrentUser() user: any) {
    return this.pharmacyService.getExpiredLots(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('lots')
  createLot(@CurrentUser() user: any, @Body() body: any) {
    return this.pharmacyService.createLot(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('lots/:id')
  updateLot(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.pharmacyService.updateLot(user.tenantId, id, body);
  }

  // ── Prescripciones ──
  @Get('prescriptions')
  findAllPrescriptions(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.pharmacyService.findAllPrescriptions(user.tenantId, status);
  }

  @Get('prescriptions/:id')
  findOnePrescription(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pharmacyService.findOnePrescription(user.tenantId, id);
  }

  @Post('prescriptions')
  createPrescription(@CurrentUser() user: any, @Body() body: any) {
    return this.pharmacyService.createPrescription(user.tenantId, body);
  }

  @Put('prescriptions/:id/status')
  updatePrescriptionStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.pharmacyService.updatePrescriptionStatus(user.tenantId, id, body.status);
  }

  // ── Clientes ──
  @Get('clients')
  findAllClients(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.pharmacyService.findAllClients(user.tenantId, search);
  }

  @Get('clients/:id')
  findOneClient(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pharmacyService.findOneClient(user.tenantId, id);
  }

  @Post('clients')
  createClient(@CurrentUser() user: any, @Body() body: any) {
    return this.pharmacyService.createClient(user.tenantId, body);
  }

  @Put('clients/:id')
  updateClient(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.pharmacyService.updateClient(user.tenantId, id, body);
  }
}