import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        featureFlags: true,
        subscription: { include: { plan: true } },
        branches: { where: { active: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async getFeatures(tenantId: string) {
    const flags = await this.prisma.featureFlag.findMany({
      where: { tenantId },
    });
    return flags.reduce((acc, flag) => {
      acc[flag.featureKey] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);
  }

  async updateProfile(tenantId: string, data: {
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
  }) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined      && { name: data.name }),
        ...(data.legalName !== undefined && { legalName: data.legalName }),
        ...(data.taxId !== undefined     && { taxId: data.taxId }),
        ...(data.industry !== undefined  && { industry: data.industry }),
        ...(data.website !== undefined   && { website: data.website }),
        ...(data.phone !== undefined     && { phone: data.phone }),
        ...(data.email !== undefined     && { email: data.email }),
        ...(data.address !== undefined   && { address: data.address }),
        ...(data.city !== undefined      && { city: data.city }),
        ...(data.state !== undefined     && { state: data.state }),
        ...(data.zipCode !== undefined   && { zipCode: data.zipCode }),
        ...(data.logoUrl !== undefined   && { logoUrl: data.logoUrl }),
      },
    });
  }

  async updateSettings(tenantId: string, settings: Prisma.InputJsonValue) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });
  }

  async updateFeatureFlag(tenantId: string, featureKey: string, enabled: boolean) {
    return this.prisma.featureFlag.update({
      where: { tenantId_featureKey: { tenantId, featureKey } },
      data: { enabled },
    });
  }

  async getStats(tenantId: string) {
    const [totalSales, totalProducts, totalUsers, branches] = await Promise.all([
      this.prisma.sale.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId, active: true } }),
      this.prisma.user.count({ where: { tenantId, active: true } }),
      this.prisma.branch.count({ where: { tenantId, active: true } }),
    ]);
    return { totalSales, totalProducts, totalUsers, branches };
  }

  // ── Activa módulo de industria + feature flag ──────────────────────────────
  async activateIndustryModule(tenantId: string, industry: string) {
    // 1. Actualiza la industria del tenant
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { industry },
    });

    // 2. Activa el feature flag correspondiente (upsert)
    if (industry !== 'general') {
      const flagKey = `${industry}_module`;
      await this.prisma.featureFlag.upsert({
        where: { tenantId_featureKey: { tenantId, featureKey: flagKey } },
        update: { enabled: true },
        create: { tenantId, featureKey: flagKey, enabled: true },
      });
    }

    // 3. Registra el módulo como add-on en la suscripción (para billing futuro)
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (subscription && industry !== 'general') {
      // Guarda el add-on en los metadata de la suscripción
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          // Almacena add-ons como JSON en metadata si el campo existe,
          // o simplemente lo dejamos para cuando integremos Stripe
          updatedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      industry,
      moduleActivated: industry !== 'general' ? `${industry}_module` : null,
      additionalCost: industry !== 'general' ? 22 : 0,
    };
  }
}