import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('branch/:branchId')
  findByBranch(@CurrentUser() user: any, @Param('branchId') branchId: string) {
    return this.inventoryService.findByBranch(user.tenantId, branchId);
  }

  @Get('low-stock')
  getLowStock(@CurrentUser() user: any) {
    return this.inventoryService.getLowStock(user.tenantId);
  }

  @Get(':productId/movements/:branchId')
  getMovements(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.inventoryService.getMovements(user.tenantId, productId, branchId);
  }

  @Roles('admin', 'manager')
  @Post('add-stock')
  addStock(@CurrentUser() user: any, @Body() body: {
    productId: string;
    branchId: string;
    quantity: number;
    reason?: string;
  }) {
    return this.inventoryService.addStock(user.tenantId, body);
  }
}