import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('restaurant')
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.restaurantService.getStats(user.tenantId);
  }

  // ── Mesas ──
  @Get('tables')
  findAllTables(@CurrentUser() user: any, @Query('branchId') branchId?: string) {
    return this.restaurantService.findAllTables(user.tenantId, branchId);
  }

  @Roles('admin', 'manager')
  @Post('tables')
  createTable(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createTable(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('tables/:id')
  updateTable(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateTable(user.tenantId, id, body);
  }

  @Put('tables/:id/status')
  updateTableStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.restaurantService.updateTableStatus(user.tenantId, id, body.status);
  }

  // ── Modificadores ──
  @Get('modifiers')
  findAllModifiers(@CurrentUser() user: any) {
    return this.restaurantService.findAllModifierGroups(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('modifiers')
  createModifier(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createModifierGroup(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('modifiers/:id')
  updateModifier(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateModifierGroup(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Delete('modifiers/:id')
  deleteModifier(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restaurantService.deleteModifierGroup(user.tenantId, id);
  }

  @Roles('admin', 'manager')
  @Post('modifiers/:groupId/products/:productId')
  assignModifier(@CurrentUser() user: any, @Param('groupId') groupId: string, @Param('productId') productId: string) {
    return this.restaurantService.assignModifierToProduct(user.tenantId, productId, groupId);
  }

  @Roles('admin', 'manager')
  @Delete('modifiers/:groupId/products/:productId')
  removeModifier(@CurrentUser() user: any, @Param('groupId') groupId: string, @Param('productId') productId: string) {
    return this.restaurantService.removeModifierFromProduct(user.tenantId, productId, groupId);
  }

  // ── Combos ──
  @Get('combos')
  findAllCombos(@CurrentUser() user: any) {
    return this.restaurantService.findAllCombos(user.tenantId);
  }

  @Get('combos/available')
  getAvailableCombos(@CurrentUser() user: any) {
    return this.restaurantService.getAvailableCombos(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('combos')
  createCombo(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createCombo(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('combos/:id')
  updateCombo(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateCombo(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Delete('combos/:id')
  deleteCombo(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restaurantService.deleteCombo(user.tenantId, id);
  }

  // ── Reservaciones ──
  @Get('reservations')
  findAllReservations(@CurrentUser() user: any, @Query('date') date?: string) {
    return this.restaurantService.findAllReservations(user.tenantId, date);
  }

  @Get('reservations/upcoming')
  getUpcomingReservations(@CurrentUser() user: any) {
    return this.restaurantService.findUpcomingReservations(user.tenantId);
  }

  @Post('reservations')
  createReservation(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createReservation(user.tenantId, body);
  }

  @Put('reservations/:id')
  updateReservation(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateReservation(user.tenantId, id, body);
  }

  @Put('reservations/:id/status')
  updateReservationStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.restaurantService.updateReservationStatus(user.tenantId, id, body.status);
  }

  // ── Órdenes ──
  @Get('orders')
  findAllOrders(@CurrentUser() user: any, @Query('status') status?: string, @Query('branchId') branchId?: string) {
    return this.restaurantService.findAllOrders(user.tenantId, status, branchId);
  }

  @Get('orders/kitchen')
  getKitchenOrders(@CurrentUser() user: any, @Query('branchId') branchId?: string, @Query('stationId') stationId?: string) {
    return this.restaurantService.getKitchenOrders(user.tenantId, branchId, stationId);
  }

  @Get('orders/:id')
  findOneOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restaurantService.findOneOrder(user.tenantId, id);
  }

  @Post('orders')
  createOrder(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createOrder(user.tenantId, user.sub, body);
  }

  @Post('orders/:id/items')
  addItems(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { items: any[] }) {
    return this.restaurantService.addItemsToOrder(user.tenantId, id, body.items);
  }

  @Put('orders/:id/status')
  updateOrderStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.restaurantService.updateOrderStatus(user.tenantId, id, body.status);
  }

  @Put('orders/:orderId/items/:itemId/status')
  updateItemStatus(@CurrentUser() user: any, @Param('orderId') orderId: string, @Param('itemId') itemId: string, @Body() body: { status: string }) {
    return this.restaurantService.updateItemStatus(user.tenantId, orderId, itemId, body.status);
  }

  @Post('orders/:id/split-payment')
  splitPayment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { payments: any[] }) {
    return this.restaurantService.splitPayment(user.tenantId, id, body.payments);
  }

  @Post('orders/:id/close')
  closeOrder(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { paymentMethod: string; tip?: number }) {
    return this.restaurantService.closeOrder(user.tenantId, id, body.paymentMethod, body.tip ?? 0);
  }

  // ── Estaciones de cocina ──
  @Get('stations')
  findAllStations(@CurrentUser() user: any) {
    return this.restaurantService.findAllStations(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('stations')
  createStation(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createStation(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Post('stations/:id/products/:productId')
  assignProduct(@CurrentUser() user: any, @Param('id') id: string, @Param('productId') productId: string) {
    return this.restaurantService.assignProductToStation(user.tenantId, id, productId);
  }

  // ── Delivery ──
  @Get('delivery')
  findAllDelivery(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.restaurantService.findAllDeliveryOrders(user.tenantId, status);
  }

  @Put('delivery/:id/status')
  updateDeliveryStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.restaurantService.updateDeliveryStatus(user.tenantId, id, body.status);
  }

  // ── Cierre de caja ──
  @Get('register/shifts')
  getShifts(@CurrentUser() user: any) {
    return this.restaurantService.getRegisterShifts(user.tenantId);
  }

  @Post('register/open')
  openShift(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.openRegisterShift(user.tenantId, user.sub, body);
  }

  @Post('register/close')
  closeShift(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.closeRegisterShift(user.tenantId, user.sub, body);
  }

  // ── Happy Hour ──
  @Get('happy-hour')
  findAllHappyHours(@CurrentUser() user: any) {
    return this.restaurantService.findAllHappyHours(user.tenantId);
  }

  @Get('happy-hour/active')
  getActiveHappyHour(@CurrentUser() user: any) {
    return this.restaurantService.getActiveHappyHour(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('happy-hour')
  createHappyHour(@CurrentUser() user: any, @Body() body: any) {
    return this.restaurantService.createHappyHour(user.tenantId, body);
  }
}