import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get('permissions')
  getPermissions() {
    return this.rolesService.getSystemPermissions();
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rolesService.findOne(user.tenantId, id);
  }

  @Roles('admin')
  @Post()
  create(@CurrentUser() user: any, @Body() body: {
    name: string;
    displayName: string;
    color: string;
    permissions: string[];
  }) {
    return this.rolesService.create(user.tenantId, body);
  }

  @Roles('admin')
  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: {
    displayName?: string;
    color?: string;
    permissions?: string[];
  }) {
    return this.rolesService.update(user.tenantId, id, body);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rolesService.remove(user.tenantId, id);
  }

  @Roles('admin')
  @Post('assign')
  assignToUser(@CurrentUser() user: any, @Body() body: { userId: string; roleId: string }) {
    return this.rolesService.assignToUser(user.tenantId, body.userId, body.roleId);
  }

  @Roles('admin')
  @Post('seed-defaults')
  seedDefaults(@CurrentUser() user: any) {
    return this.rolesService.seedDefaultRoles(user.tenantId);
  }
}