import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BakeryService } from './bakery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bakery')
export class BakeryController {
  constructor(private bakeryService: BakeryService) {}

  // ── Stats ──
  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.bakeryService.getProductionStats(user.tenantId);
  }

  // ── Recetas ──
  @Get('recipes')
  findAllRecipes(@CurrentUser() user: any) {
    return this.bakeryService.findAllRecipes(user.tenantId);
  }

  @Get('recipes/:id')
  findOneRecipe(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bakeryService.findOneRecipe(user.tenantId, id);
  }

  @Get('recipes/:id/availability')
  checkAvailability(@CurrentUser() user: any, @Param('id') id: string, @Query('quantity') qty = '1', @Query('branchId') branchId?: string) {
    return this.bakeryService.checkIngredientAvailability(user.tenantId, id, parseInt(qty), branchId);
  }

  @Roles('admin', 'manager')
  @Post('recipes')
  createRecipe(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createRecipe(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('recipes/:id')
  updateRecipe(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.bakeryService.updateRecipe(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Delete('recipes/:id')
  deleteRecipe(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bakeryService.deleteRecipe(user.tenantId, id);
  }

  // ── Turnos ──
  @Get('shifts')
  findAllShifts(@CurrentUser() user: any, @Query('date') date?: string) {
    return this.bakeryService.findAllShifts(user.tenantId, date);
  }

  @Roles('admin', 'manager')
  @Post('shifts')
  createShift(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createShift(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('shifts/:id/close')
  closeShift(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bakeryService.closeShift(user.tenantId, id);
  }

  // ── Producción ──
  @Get('productions')
  findAllProductions(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.bakeryService.findAllProductions(user.tenantId, branchId);
  }

  @Get('productions/daily-plan')
  getDailyPlan(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.bakeryService.getDailyProductionPlan(user.tenantId, branchId);
  }

  @Roles('admin', 'manager')
  @Post('productions')
  createProduction(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createProduction(user.tenantId, body);
  }

  @Put('productions/:id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.bakeryService.updateProductionStatus(user.tenantId, id, body.status);
  }

  // ── Mermas ──
  @Get('wastes')
  findAllWastes(@CurrentUser() user: any) {
    return this.bakeryService.findAllWastes(user.tenantId);
  }

  @Get('wastes/stats')
  getWasteStats(@CurrentUser() user: any) {
    return this.bakeryService.getWasteStats(user.tenantId);
  }

  @Post('wastes')
  createWaste(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createWaste(user.tenantId, body);
  }

  // ── Encargos ──
  @Get('encargos')
  findAllEncargos(@CurrentUser() user: any) {
    return this.bakeryService.findAllEncargos(user.tenantId);
  }

  @Post('encargos')
  createEncargo(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createEncargo(user.tenantId, body);
  }

  @Put('encargos/:id/status')
  updateEncargoStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.bakeryService.updateEncargoStatus(user.tenantId, id, body.status);
  }

  // ── Mínimos diarios ──
  @Get('minimums')
  findAllMinimums(@CurrentUser() user: any) {
    return this.bakeryService.findAllMinimums(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('minimums')
  createMinimum(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createMinimum(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Delete('minimums/:id')
  deleteMinimum(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bakeryService.deleteMinimum(user.tenantId, id);
  }

  // ── Proveedores ──
  @Get('suppliers')
  findAllSuppliers(@CurrentUser() user: any) {
    return this.bakeryService.findAllSuppliers(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('suppliers')
  createSupplier(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createSupplier(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('suppliers/:id')
  updateSupplier(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.bakeryService.updateSupplier(user.tenantId, id, body);
  }

  // ── Órdenes de compra ──
  @Get('purchase-orders')
  findAllPurchaseOrders(@CurrentUser() user: any) {
    return this.bakeryService.findAllPurchaseOrders(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('purchase-orders')
  createPurchaseOrder(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createPurchaseOrder(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('purchase-orders/:id/receive')
  receivePurchaseOrder(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { items: any[] }) {
    return this.bakeryService.receivePurchaseOrder(user.tenantId, id, body.items);
  }

  // ── Presentaciones ──
  @Get('presentations')
  findPresentations(@CurrentUser() user: any, @Query('productId') productId?: string) {
    return this.bakeryService.findPresentations(user.tenantId, productId);
  }

  @Roles('admin', 'manager')
  @Post('presentations')
  createPresentation(@CurrentUser() user: any, @Body() body: any) {
    return this.bakeryService.createPresentation(user.tenantId, body);
  }
}