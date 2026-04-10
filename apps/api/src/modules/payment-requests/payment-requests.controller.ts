import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { PaymentRequestsService } from './payment-requests.service';
import { JwtAuthGuard }           from '../auth/guards/jwt-auth.guard';
import { RolesGuard }             from '../auth/guards/roles.guard';
import { Roles }                  from '../../common/decorators/roles.decorator';
import { CurrentUser }            from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private service: PaymentRequestsService) {}

  // ── Cliente: crear solicitud ──────────────────────────────────────────────
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: { planName: string; billingCycle: 'monthly' | 'annual' },
  ) {
    return this.service.createRequest(user.tenantId, user.sub, body);
  }

  // ── Cliente: subir comprobante ────────────────────────────────────────────
  @Put(':id/receipt')
  uploadReceipt(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { receiptUrl: string },
  ) {
    return this.service.uploadReceipt(id, user.tenantId, body.receiptUrl);
  }

  // ── Cliente: ver mis solicitudes ──────────────────────────────────────────
  @Get('mine')
  getMine(@CurrentUser() user: any) {
    return this.service.getMyRequests(user.tenantId);
  }

  // ── Admin: ver todas ──────────────────────────────────────────────────────
  @Get()
  @Roles('admin', 'superadmin')
  getAll(@Query('status') status?: string) {
    return this.service.getAllRequests(status ? { status } : undefined);
  }

  // ── Admin: aprobar ────────────────────────────────────────────────────────
  @Put(':id/approve')
  @Roles('admin', 'superadmin')
  approve(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.service.approveRequest(id, user.sub, body.notes);
  }

  // ── Admin: rechazar ───────────────────────────────────────────────────────
  @Put(':id/reject')
  @Roles('admin', 'superadmin')
  reject(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.service.rejectRequest(id, user.sub, body.notes);
  }
}
