import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Resend }        from 'resend';

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 19,  annual: 190 },
  growth:  { monthly: 40,  annual: 400 },
  scale:   { monthly: 60,  annual: 600 },
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth:  'Growth',
  scale:   'Scale',
};

const SINPE_NUMBER = '87905876';
const SINPE_NAME   = 'Jacobo Gutiérrez Rodríguez';
const ADMIN_EMAIL  = 'ventas@daxcloud.shop';

function generateReference(tenantId: string): string {
  const short = tenantId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const rand  = Math.floor(Math.random() * 9000 + 1000);
  return `DAX-${short}-${rand}`;
}

@Injectable()
export class PaymentRequestsService {
  private resend: Resend;

  constructor(private prisma: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  // ── Crear solicitud de pago ───────────────────────────────────────────────
  async createRequest(
    tenantId: string,
    userId:   string,
    dto: {
      planName:     string;
      billingCycle: 'monthly' | 'annual';
    },
  ) {
    const { planName, billingCycle } = dto;

    if (!PLAN_PRICES[planName]) throw new BadRequestException('Plan inválido');

    const prices = PLAN_PRICES[planName];
    const amount = billingCycle === 'annual' ? prices.annual : prices.monthly;

    // Verifica que no tenga una solicitud pendiente del mismo plan
    const existing = await this.prisma.paymentRequest.findFirst({
      where: { tenantId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya tienes una solicitud pendiente. Espera a que sea procesada o contáctanos.',
      );
    }

    const reference = generateReference(tenantId);

    const request = await this.prisma.paymentRequest.create({
      data: {
        tenantId,
        planName,
        billingCycle,
        amount,
        currency: 'USD',
        reference,
        requestedBy: userId,
      },
    });

    // Notifica al admin
    await this._notifyAdmin(request, tenantId).catch(() => {});

    return {
      ...request,
      sinpeNumber: SINPE_NUMBER,
      sinpeName:   SINPE_NAME,
      amount,
      currency:    'USD',
    };
  }

  // ── Subir comprobante ─────────────────────────────────────────────────────
  async uploadReceipt(requestId: string, tenantId: string, receiptUrl: string) {
    const request = await this.prisma.paymentRequest.findFirst({
      where: { id: requestId, tenantId },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== 'pending') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    const updated = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data:  { receiptUrl },
    });

    // Notifica al admin que hay comprobante
    await this._notifyAdminReceipt(updated, tenantId).catch(() => {});

    return updated;
  }

  // ── Ver mis solicitudes ───────────────────────────────────────────────────
  async getMyRequests(tenantId: string) {
    return this.prisma.paymentRequest.findMany({
      where:   { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── [ADMIN] Ver todas las solicitudes ─────────────────────────────────────
  async getAllRequests(filters?: { status?: string }) {
    return this.prisma.paymentRequest.findMany({
      where:   filters?.status ? { status: filters.status } : {},
      include: {
        tenant: {
          select: { name: true, slug: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── [ADMIN] Aprobar solicitud ─────────────────────────────────────────────
  async approveRequest(requestId: string, adminUserId: string, notes?: string) {
    const request = await this.prisma.paymentRequest.findUnique({
      where:   { id: requestId },
      include: { tenant: true },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== 'pending') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    // Activa el plan
    const plan = await this.prisma.plan.findUnique({
      where: { name: request.planName as any },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const now       = new Date();
    const periodEnd = new Date(now);
    if (request.billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Actualiza suscripción
    await this.prisma.subscription.upsert({
      where: { tenantId: request.tenantId },
      update: {
        planId:             plan.id,
        status:             'active',
        currentPeriodStart: now,
        currentPeriodEnd:   periodEnd,
        cancelAtPeriodEnd:  false,
        cancelledAt:        null,
        trialEndsAt:        null,
      },
      create: {
        tenantId:           request.tenantId,
        planId:             plan.id,
        status:             'active',
        currentPeriodStart: now,
        currentPeriodEnd:   periodEnd,
      },
    });

    // Actualiza feature flags
    const features = plan.features as Record<string, any>;
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'boolean') {
        await this.prisma.featureFlag.upsert({
          where:  { tenantId_featureKey: { tenantId: request.tenantId, featureKey: key } },
          update: { enabled: value },
          create: { tenantId: request.tenantId, featureKey: key, enabled: value },
        });
      }
    }

    // Crea factura
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId: request.tenantId },
    });
    if (sub) {
      await this.prisma.invoice.create({
        data: {
          subscriptionId: sub.id,
          amount:         request.amount,
          currency:       'USD',
          status:         'paid',
          description:    `Plan ${PLAN_LABELS[request.planName]} · SINPE #${request.reference}`,
          paidAt:         now,
        },
      });
    }

    // Marca solicitud como aprobada
    const updated = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status:     'approved',
        notes,
        reviewedBy: adminUserId,
        reviewedAt: now,
      },
    });

    // Notifica al cliente
    await this._notifyClientApproved(request).catch(() => {});

    return updated;
  }

  // ── [ADMIN] Rechazar solicitud ────────────────────────────────────────────
  async rejectRequest(requestId: string, adminUserId: string, notes?: string) {
    const request = await this.prisma.paymentRequest.findUnique({
      where:   { id: requestId },
      include: { tenant: true },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== 'pending') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    const updated = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status:     'rejected',
        notes,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    // Notifica al cliente
    await this._notifyClientRejected(request, notes).catch(() => {});

    return updated;
  }

  // ── Emails ────────────────────────────────────────────────────────────────
  private async _notifyAdmin(request: any, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where:  { id: tenantId },
      select: { name: true, email: true },
    });

    await this.resend.emails.send({
      from:    'DaxCloud <notificaciones@daxcloud.shop>',
      to:      ADMIN_EMAIL,
      subject: `💰 Nueva solicitud de pago — ${PLAN_LABELS[request.planName]} · ${tenant?.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #FF5C35;">Nueva solicitud de pago SINPE</h2>
          <p><strong>Negocio:</strong> ${tenant?.name ?? tenantId}</p>
          <p><strong>Plan:</strong> ${PLAN_LABELS[request.planName]} (${request.billingCycle === 'annual' ? 'Anual' : 'Mensual'})</p>
          <p><strong>Monto:</strong> $${request.amount} USD</p>
          <p><strong>Referencia:</strong> ${request.reference}</p>
          <p><strong>Correo cliente:</strong> ${tenant?.email ?? '—'}</p>
          <br/>
          <a href="https://daxcloud.shop/admin" style="background:#FF5C35;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
            Ver en panel admin →
          </a>
        </div>
      `,
    });
  }

  private async _notifyAdminReceipt(request: any, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where:  { id: tenantId },
      select: { name: true },
    });

    await this.resend.emails.send({
      from:    'DaxCloud <notificaciones@daxcloud.shop>',
      to:      ADMIN_EMAIL,
      subject: `📎 Comprobante subido — ${tenant?.name} · ${request.reference}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #FF5C35;">Comprobante de pago recibido</h2>
          <p><strong>Negocio:</strong> ${tenant?.name}</p>
          <p><strong>Referencia:</strong> ${request.reference}</p>
          ${request.receiptUrl ? `<p><a href="${request.receiptUrl}">Ver comprobante →</a></p>` : ''}
          <br/>
          <a href="https://daxcloud.shop/admin" style="background:#FF5C35;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
            Revisar y aprobar →
          </a>
        </div>
      `,
    });
  }

  private async _notifyClientApproved(request: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where:  { id: request.tenantId },
      select: { name: true, email: true },
    });
    if (!tenant?.email) return;

    await this.resend.emails.send({
      from:    'DaxCloud <notificaciones@daxcloud.shop>',
      to:      tenant.email,
      subject: `✅ Tu plan ${PLAN_LABELS[request.planName]} está activo — DaxCloud`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0F1924; color: #fff;">
          <h2 style="color: #3DBF7F;">¡Tu pago fue aprobado!</h2>
          <p>Hola ${tenant.name},</p>
          <p>Tu pago fue verificado y tu plan <strong>${PLAN_LABELS[request.planName]}</strong> ya está activo.</p>
          <p><strong>Referencia:</strong> ${request.reference}</p>
          <p><strong>Monto:</strong> $${request.amount} USD</p>
          <br/>
          <a href="https://daxcloud.shop/dashboard" style="background:#FF5C35;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
            Ir a mi dashboard →
          </a>
          <br/><br/>
          <p style="color:#666;font-size:12px;">DaxCloud · ventas@daxcloud.shop</p>
        </div>
      `,
    });
  }

  private async _notifyClientRejected(request: any, notes?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where:  { id: request.tenantId },
      select: { name: true, email: true },
    });
    if (!tenant?.email) return;

    await this.resend.emails.send({
      from:    'DaxCloud <notificaciones@daxcloud.shop>',
      to:      tenant.email,
      subject: `❌ Problema con tu pago — DaxCloud`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #E05050;">No pudimos verificar tu pago</h2>
          <p>Hola ${tenant.name},</p>
          <p>Tuvimos un problema al verificar tu pago para el plan <strong>${PLAN_LABELS[request.planName]}</strong>.</p>
          ${notes ? `<p><strong>Motivo:</strong> ${notes}</p>` : ''}
          <p>Por favor contáctanos a <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a> para resolverlo.</p>
          <p><strong>Referencia:</strong> ${request.reference}</p>
        </div>
      `,
    });
  }
}
