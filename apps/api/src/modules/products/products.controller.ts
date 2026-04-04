import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(user.tenantId, { category, search });
  }

  @Get('categories')
  getCategories(@CurrentUser() user: any) {
    return this.productsService.getCategories(user.tenantId);
  }

  @Get('barcode/:barcode')
  findByBarcode(@CurrentUser() user: any, @Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(user.tenantId, barcode);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.findOne(user.tenantId, id);
  }

  @Roles('admin', 'manager')
  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.productsService.create(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.productsService.update(user.tenantId, id, body);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.remove(user.tenantId, id);
  }
}