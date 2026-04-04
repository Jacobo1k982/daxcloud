import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('subscription')
  getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.tenantId);
  }

  @Get('invoices')
  getInvoices(@CurrentUser() user: any) {
    return this.billingService.getInvoices(user.tenantId);
  }

  @Roles('admin')
  @Post('change-plan')
  changePlan(@CurrentUser() user: any, @Body() body: { planName: string }) {
    return this.billingService.changePlan(user.tenantId, body.planName);
  }

  @Roles('admin')
  @Put('cancel')
  cancelSubscription(@CurrentUser() user: any) {
    return this.billingService.cancelSubscription(user.tenantId);
  }

  @Roles('admin')
  @Put('reactivate')
  reactivateSubscription(@CurrentUser() user: any) {
    return this.billingService.reactivateSubscription(user.tenantId);
  }

  @Roles('admin')
  @Post('stripe/checkout')
  createStripeCheckout(@CurrentUser() user: any, @Body() body: { planName: string }) {
    return this.billingService.createStripeCheckout(user.tenantId, body.planName);
  }
}