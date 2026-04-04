import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clothing')
export class ClothingController {
  constructor(private clothingService: ClothingService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.clothingService.getStats(user.tenantId);
  }

  @Get('stock/critical')
  getCriticalStock(@CurrentUser() user: any) {
    return this.clothingService.getCriticalStock(user.tenantId);
  }

  // ── Variantes ──
  @Get('variants')
  findAllVariants(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.clothingService.findAllVariants(user.tenantId, search);
  }

  @Get('variants/product/:productId')
  findVariantsByProduct(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.clothingService.findVariantsByProduct(user.tenantId, productId);
  }

  @Roles('admin', 'manager')
  @Post('variants')
  createVariant(@CurrentUser() user: any, @Body() body: any) {
    return this.clothingService.createVariant(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Post('variants/bulk')
  createBulkVariants(@CurrentUser() user: any, @Body() body: { productId: string; sizes: string[]; colors: { name: string; hex: string }[]; basePrice?: number; initialStock?: number }) {
    return this.clothingService.createBulkVariants(user.tenantId, body.productId, body);
  }

  @Roles('admin', 'manager')
  @Put('variants/:id')
  updateVariant(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.clothingService.updateVariant(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Put('variants/:id/stock')
  updateStock(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { quantity: number; operation: 'set' | 'increment' | 'decrement' }) {
    return this.clothingService.updateVariantStock(user.tenantId, id, body.quantity, body.operation);
  }

  @Roles('admin', 'manager')
  @Delete('variants/:id')
  deleteVariant(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clothingService.deleteVariant(user.tenantId, id);
  }

  // ── Colecciones ──
  @Get('collections')
  findAllCollections(@CurrentUser() user: any) {
    return this.clothingService.findAllCollections(user.tenantId);
  }

  @Roles('admin', 'manager')
  @Post('collections')
  createCollection(@CurrentUser() user: any, @Body() body: any) {
    return this.clothingService.createCollection(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put('collections/:id')
  updateCollection(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.clothingService.updateCollection(user.tenantId, id, body);
  }

  @Roles('admin', 'manager')
  @Post('collections/:id/products')
  addProduct(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { productId: string }) {
    return this.clothingService.addProductToCollection(user.tenantId, id, body.productId);
  }

  @Roles('admin', 'manager')
  @Delete('collections/:id/products/:productId')
  removeProduct(@CurrentUser() user: any, @Param('id') id: string, @Param('productId') productId: string) {
    return this.clothingService.removeProductFromCollection(user.tenantId, id, productId);
  }

  @Roles('admin', 'manager')
  @Delete('collections/:id')
  deleteCollection(@CurrentUser() user: any, @Param('id') id: string) {
    return this.clothingService.deleteCollection(user.tenantId, id);
  }
}