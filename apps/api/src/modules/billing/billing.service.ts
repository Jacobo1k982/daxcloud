import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ── Suscripción actual ────────────────────────────────────────────────────
  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where:   { tenantId },
      include: {
        plan:     true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 12 },
      },
    });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');
    return subscription;
  }

  // ── Cambiar plan ──────────────────────────────────────────────────────────
  async changePlan(tenantId: string, newPlanName: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { name: newPlanName as any },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const subscription = await this.prisma.subscription.findUnique({
      where:   { tenantId },
      include: { plan: true },
    });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');

    if (subscription.plan.name === newPlanName) {
      throw new BadRequestException('Ya estás en este plan');
    }

    // Actualiza feature flags según el nuevo plan
    const features = plan.features as Record<string, any>;
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'boolean') {
        await this.prisma.featureFlag.upsert({
          where:  { tenantId_featureKey: { tenantId, featureKey: key } },
          update: { enabled: value },
          create: { tenantId, featureKey: key, enabled: value },
        });
      }
    }

    const now       = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        planId:             plan.id,
        status:             'active',
        currentPeriodStart: now,
        currentPeriodEnd:   periodEnd,
        cancelAtPeriodEnd:  false,
        cancelledAt:        null,
        trialEndsAt:        null, // trial termina al activar plan pago
        invoices: {
          create: {
            amount:      plan.priceMonthly,
            currency:    'USD',
            status:      'paid',
            description: `Cambio a plan ${plan.displayName}`,
            paidAt:      now,
          },
        },
      },
      include: { plan: true, invoices: { orderBy: { createdAt: 'desc' }, take: 12 } },
    });

    return updated;
  }

  // ── Iniciar/extender trial de 15 días ─────────────────────────────────────
  async startTrial(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');

    // Solo se puede activar trial si nunca ha tenido uno o si está en trialing
    if (subscription.status === 'active') {
      throw new BadRequestException('Ya tienes un plan activo — no puedes iniciar un trial');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status:      'trialing',
        trialEndsAt,
      },
      include: { plan: true },
    });
  }

  // ── Cancelar suscripción ──────────────────────────────────────────────────
  async cancelSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');
    if (subscription.status === 'cancelled') {
      throw new BadRequestException('La suscripción ya está cancelada');
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt:       new Date(),
      },
      include: { plan: true },
    });
  }

  // ── Reactivar suscripción ─────────────────────────────────────────────────
  async reactivateSubscription(tenantId: string) {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt:       null,
        status:            'active',
      },
      include: { plan: true },
    });
  }

  // ── Historial de facturas ─────────────────────────────────────────────────
  async getInvoices(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription) return [];

    return this.prisma.invoice.findMany({
      where:   { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Stripe checkout (pendiente de integración) ────────────────────────────
  async createStripeCheckout(tenantId: string, planName: string) {
    return {
      message: 'Stripe no configurado aún',
      planName,
      ready:   false,
    };
  }

  async handleStripeWebhook(payload: any, signature: string) {
    return { received: true };
  }
}
