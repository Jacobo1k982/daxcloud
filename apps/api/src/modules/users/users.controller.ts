import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService }  from './users.service';
import { JwtAuthGuard }  from '../auth/guards/jwt-auth.guard';
import { RolesGuard }    from '../auth/guards/roles.guard';
import { Roles }         from '../../common/decorators/roles.decorator';
import { CurrentUser }   from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin', 'manager')
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.tenantId);
  }

  @Get('me')
  findMe(@CurrentUser() user: any) {
    return this.usersService.findMe(user.sub);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.findOne(user.tenantId, id);
  }

  @Put('me')
  updateProfile(@CurrentUser() user: any, @Body() body: {
    firstName?: string; lastName?: string; email?: string;
    phone?: string; jobTitle?: string; avatarUrl?: string;
    language?: string; timezone?: string; signature?: string;
  }) {
    return this.usersService.updateProfile(user.sub, user.tenantId, body);
  }

  @Put('me/pin')
  updatePin(@CurrentUser() user: any, @Body() body: { pin: string }) {
    return this.usersService.updatePin(user.sub, user.tenantId, body.pin);
  }

  @Put('me/password')
  changePassword(@CurrentUser() user: any, @Body() body: {
    currentPassword: string; newPassword: string;
  }) {
    return this.usersService.changePassword(user.sub, user.tenantId, body);
  }

  @Post('invite')
  @Roles('admin')
  invite(@CurrentUser() user: any, @Body() body: {
    email: string; firstName: string; lastName: string;
    role: 'admin' | 'manager' | 'cashier';
  }) {
    return this.usersService.invite(user.tenantId, body);
  }

  @Put(':id/toggle')
  @Roles('admin')
  toggleActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.toggleActive(user.tenantId, id);
  }

  @Put(':id/role')
  @Roles('admin')
  updateRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { role: 'admin' | 'manager' | 'cashier' },
  ) {
    return this.usersService.updateRole(user.tenantId, id, body.role);
  }

  @Put(':id/reset-password')
  @Roles('admin')
  resetPassword(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.resetPassword(user.tenantId, id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.remove(user.tenantId, id, user.sub);
  }
}
