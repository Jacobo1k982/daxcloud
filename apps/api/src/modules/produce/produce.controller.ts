import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProduceService } from './produce.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('produce')
export class ProduceController {
  constructor(private produceService: ProduceService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.produceService.getStats(user.tenantId);
  }

  @Get('alerts')
  getAlerts(@CurrentUser() user: any) {
    return this.produceService.getAlerts(user.tenantId);
  }

  // ── Productos ──
  @Get('products')
  findAllProducts(@CurrentUser() user: any, @Query('section') section?: string) {
    return this.produceService.findAllProduceProducts(user.tenantId, section);
  }

  @Roles('admin', 'manager')
  @Post('products')
  createProduct(@CurrentUser() user: any, @Body() body: any) {
    return this.produceService.createProduceProduct(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('products/:id')
  updateProduct(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.produceService.updateProduceProduct(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Put('products/:id/price')
  updatePrice(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { price: number; reason?: string }) {
    return this.produceService.updatePrice(user.tenantId, id, body.price, body.reason);
  }

  @Get('products/:id/price-history')
  getPriceHistory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.produceService.getPriceHistory(user.tenantId, id);
  }

  // ── Lotes de cosecha ──
  @Get('lots')
  findAllLots(@CurrentUser() user: any, @Query('branchId') branchId?: string, @Query('status') status?: string) {
    return this.produceService.findAllHarvestLots(user.tenantId, branchId, status);
  }

  @Roles('admin', 'manager')
  @Post('lots')
  createLot(@CurrentUser() user: any, @Body() body: any) {
    return this.produceService.createHarvestLot(user.tenantId, body);
  }

  @Post('lots/update-freshness')
  updateFreshness(@CurrentUser() user: any) {
    return this.produceService.updateLotFreshness(user.tenantId);
  }

  @Put('lots/:id/temperature')
  updateTemperature(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { temperature: number }) {
    return this.produceService.updateLotTemperature(user.tenantId, id, body.temperature);
  }

  @Roles('admin', 'manager')
  @Put('lots/:id/discard')
  discardLot(@CurrentUser() user: any, @Param('id') id: string) {
    return this.produceService.discardLot(user.tenantId, id);
  }

  // ── Mermas ──
  @Get('wastes')
  findAllWastes(@CurrentUser() user: any) {
    return this.produceService.findAllWastes(user.tenantId);
  }

  @Post('wastes')
  createWaste(@CurrentUser() user: any, @Body() body: any) {
    return this.produceService.createWaste(user.tenantId, body);
  }

  // ── Secciones ──
  @Get('sections')
  findAllSections(@CurrentUser() user: any) {
    return this.produceService.findAllSections(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('sections')
  createSection(@CurrentUser() user: any, @Body() body: any) {
    return this.produceService.createSection(user.tenantId, body);
  }

  @Put('sections/:id/conditions')
  updateConditions(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { temperature?: number; humidity?: number }) {
    return this.produceService.updateSectionConditions(user.tenantId, id, body);
  }

  // ── Proveedores ──
  @Get('suppliers')
  findAllSuppliers(@CurrentUser() user: any) {
    return this.produceService.findAllSuppliers(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('suppliers')
  createSupplier(@CurrentUser() user: any, @Body() body: any) {
    return this.produceService.createSupplier(user.tenantId, body);
  }
}