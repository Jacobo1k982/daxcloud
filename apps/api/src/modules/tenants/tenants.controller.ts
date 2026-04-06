import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('me')
  getMyTenant(@CurrentUser() user: any) {
    return this.tenantsService.findById(user.tenantId);
  }

  @Get('me/features')
  getMyFeatures(@CurrentUser() user: any) {
    return this.tenantsService.getFeatures(user.tenantId);
  }

  @Get('me/stats')
  getMyStats(@CurrentUser() user: any) {
    return this.tenantsService.getStats(user.tenantId);
  }

  @Roles('admin')
  @Put('me/profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() body: {
      name?: string;
      legalName?: string;
      taxId?: string;
      industry?: string;
      website?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      logoUrl?: string;
    },
  ) {
    return this.tenantsService.updateProfile(user.tenantId, body);
  }

  @Roles('admin', 'superadmin')
  @Put('me/settings')
  updateSettings(
    @CurrentUser() user: any,
    @Body() body: { settings: Prisma.InputJsonValue },
  ) {
    return this.tenantsService.updateSettings(user.tenantId, body.settings);
  }

  @Roles('superadmin')
  @Put('me/features/:key')
  updateFeature(
    @CurrentUser() user: any,
    @Param('key') key: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.tenantsService.updateFeatureFlag(user.tenantId, key, body.enabled);
  }

}
