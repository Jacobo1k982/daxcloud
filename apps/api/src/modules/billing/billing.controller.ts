import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { BillingService }   from './billing.service';
import { PagaditoService }  from './pagadito.service';
import { JwtAuthGuard }     from '../auth/guards/jwt-auth.guard';
import { RolesGuard }       from '../auth/guards/roles.guard';
import { Roles }            from '../../common/decorators/roles.decorator';
import { CurrentUser }      from '../../common/decorators/current-user.decorator';
import { PrismaService }    from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(
    private billingService:  BillingService,
    private pagaditoService: PagaditoService,
    private prisma:          PrismaService,
  ) {}

  @Get('subscription')
  getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.tenantId);
  }

  @Get('invoices')
  getInvoices(@CurrentUser() user: any) {
    return this.billingService.getInvoices(user.tenantId);
  }

  @Put('plan')
  @Roles('admin', 'superadmin')
  changePlan(@CurrentUser() user: any, @Body() body: { plan: string }) {
    return this.billingService.changePlan(user.tenantId, body.plan);
  }

  @Post('trial')
  @Roles('admin', 'superadmin')
  startTrial(@CurrentUser() user: any) {
    return this.billingService.startTrial(user.tenantId);
  }

  @Post('cancel')
  @Roles('admin', 'superadmin')
  cancelSubscription(@CurrentUser() user: any) {
    return this.billingService.cancelSubscription(user.tenantId);
  }

  @Post('reactivate')
  @Roles('admin', 'superadmin')
  reactivateSubscription(@CurrentUser() user: any) {
    return this.billingService.reactivateSubscription(user.tenantId);
  }

  // ── Pagadito: iniciar pago ────────────────────────────────────────────────
  @Post('pagadito/initiate')
  @Roles('admin', 'superadmin')
  async initiatePagadito(
    @CurrentUser() user: any,
    @Body() body: { planName: string; planLabel: string; amount: number; currency?: string; annual?: boolean },
  ) {
    if (!body.planName || !body.amount) throw new BadRequestException('planName y amount son requeridos');

    const ern = `DAX-${user.tenantId.slice(0,8).toUpperCase()}-${Date.now()}`;

    const result = await this.pagaditoService.initiatePayment({
      ern,
      amount:   body.amount,
      currency: body.currency ?? 'USD',
      details:  [{
        quantity:    1,
        description: `DaxCloud ${body.planLabel} - ${body.annual ? 'Anual' : 'Mensual'}`,
        price:       body.amount,
        url_product: 'https://daxcloud.shop/pricing',
      }],
    });

    // Guardar intento de pago
    await this.prisma.paymentRequest.create({
      data: {
        tenantId:  user.tenantId,
        amount:    body.amount,
        planName:  body.planName,
        billingCycle: body.annual ? `"annual"` : `"monthly"`,
        status:    'pending',
        reference: ern,
        requestedBy: user.id,
        notes:     JSON.stringify({ sessionToken: result.sessionToken, annual: body.annual }),
      },
    });

    return { url: result.url, ern, sessionToken: result.sessionToken };
  }

  // ── Pagadito: verificar pago ──────────────────────────────────────────────
  @Post('pagadito/verify')
  @Roles('admin', 'superadmin')
  async verifyPagadito(
    @CurrentUser() user: any,
    @Body() body: { tokenTrans: string; ern: string; sessionToken: string },
  ) {
    if (!body.tokenTrans || !body.sessionToken) throw new BadRequestException('tokenTrans y sessionToken requeridos');

    const statusResult = await this.pagaditoService.getStatus(body.sessionToken, body.tokenTrans);
    if (!statusResult.success) throw new BadRequestException(statusResult.message ?? 'Error al verificar');

    const paymentReq = await this.prisma.paymentRequest.findFirst({
      where: { tenantId: user.tenantId, reference: body.ern, status: 'pending' },
    });

    if (!paymentReq) return { status: statusResult.status, message: 'Solicitud de pago no encontrada' };

    if (statusResult.status === 'COMPLETED') {
      await this.prisma.paymentRequest.update({
        where: { id: paymentReq.id },
        data: {
          status: 'approved',
          notes:  JSON.stringify({ ...JSON.parse(paymentReq.notes ?? '{}'), tokenTrans: body.tokenTrans, reference: statusResult.reference }),
        },
      });
      await this.billingService.changePlan(user.tenantId, paymentReq.planName);
      return { status: 'COMPLETED', message: 'Plan activado exitosamente' };
    }

    return { status: statusResult.status, message: 'Transacción pendiente' };
  }
}

