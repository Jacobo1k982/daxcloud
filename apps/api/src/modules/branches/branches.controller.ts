import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.branchesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.branchesService.findOne(user.tenantId, id);
  }

  @Roles('admin', 'manager')
  @Post()
  create(@CurrentUser() user: any, @Body() body: { name: string; address?: string; phone?: string }) {
    return this.branchesService.create(user.tenantId, body);
  }

  @Roles('admin', 'manager')
  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { name?: string; address?: string; phone?: string }) {
    return this.branchesService.update(user.tenantId, id, body);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.branchesService.remove(user.tenantId, id);
  }
}