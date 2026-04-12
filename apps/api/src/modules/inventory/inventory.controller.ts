import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { RolesGuard }      from '../auth/guards/roles.guard';
import { Roles }           from '../../common/decorators/roles.decorator';
import { CurrentUser }     from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('branch/:branchId')
  findByBranch(
    @CurrentUser() user: any,
    @Param('branchId') branchId: string,
    @Query('search')   search?:  string,
    @Query('status')   status?:  string,
    @Query('category') category?: string,
  ) {
    return this.inventoryService.findByBranch(user.tenantId, branchId, { search, status, category });
  }

  @Get('low-stock')
  getLowStock(@CurrentUser() user: any) {
    return this.inventoryService.getLowStock(user.tenantId);
  }

  @Get('stats/:branchId')
  getStats(@CurrentUser() user: any, @Param('branchId') branchId: string) {
    return this.inventoryService.getStats(user.tenantId, branchId);
  }

  @Get(':productId/movements/:branchId')
  getMovements(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Param('branchId')  branchId:  string,
  ) {
    return this.inventoryService.getMovements(user.tenantId, productId, branchId);
  }

  @Roles('admin', 'manager')
  @Post('add-stock')
  addStock(@CurrentUser() user: any, @Body() body: any) {
    return this.inventoryService.addStock(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put(':productId/adjust/:branchId')
  adjustStock(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Param('branchId')  branchId:  string,
    @Body() body: { quantity: number; reason?: string; notes?: string },
  ) {
    return this.inventoryService.adjustStock(user.tenantId, productId, branchId, body);
  }
}
