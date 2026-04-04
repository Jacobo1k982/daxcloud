import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');
    return subscription;
  }

  async changePlan(tenantId: string, newPlanName: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { name: newPlanName as any },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');

    if (subscription.plan.name === newPlanName) {
      throw new BadRequestException('Ya estás en este plan');
    }

    // Actualiza los feature flags según el nuevo plan
    const features = plan.features as Record<string, any>;
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'boolean') {
        await this.prisma.featureFlag.upsert({
          where: { tenantId_featureKey: { tenantId, featureKey: key } },
          update: { enabled: value },
          create: { tenantId, featureKey: key, enabled: value },
        });
      }
    }

    // Crea una factura simulada del cambio
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        planId: plan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        invoices: {
          create: {
            amount: plan.priceMonthly,
            currency: 'USD',
            status: 'paid',
            description: `Cambio a plan ${plan.displayName}`,
            paidAt: now,
          },
        },
      },
      include: { plan: true, invoices: { orderBy: { createdAt: 'desc' }, take: 12 } },
    });

    return updated;
  }

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
        cancelledAt: new Date(),
      },
      include: { plan: true },
    });
  }

  async reactivateSubscription(tenantId: string) {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        status: 'active',
      },
      include: { plan: true },
    });
  }

  async getInvoices(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription) return [];

    return this.prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Preparado para Stripe — se implementará a futuro
  async createStripeCheckout(tenantId: string, planName: string) {
    // TODO: Integrar Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({...});
    // return { url: session.url };
    return {
      message: 'Stripe no configurado aún',
      planName,
      ready: false,
    };
  }

  async handleStripeWebhook(payload: any, signature: string) {
    // TODO: Integrar Stripe webhooks
    // const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    return { received: true };
  }
}