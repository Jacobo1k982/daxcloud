import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Controller('exports')
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Get('products')
  async exportProducts(@CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.exportsService.exportProducts(user.tenantId);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="productos-${date}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('sales')
  async exportSales(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.exportsService.exportSales(user.tenantId, startDate, endDate);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ventas-${date}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('inventory')
  async exportInventory(@CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.exportsService.exportInventory(user.tenantId);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="inventario-${date}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('backup')
  async exportBackup(@CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.exportsService.exportBackup(user.tenantId);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="backup-daxcloud-${date}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}