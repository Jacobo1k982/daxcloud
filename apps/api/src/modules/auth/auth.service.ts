import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const TRIAL_DAYS = 14;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug, active: true },
      include: {
        featureFlags: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!tenant) throw new UnauthorizedException('Tenant no encontrado o inactivo');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });

    if (!user || !user.active) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Credenciales inválidas');

    const features = tenant.featureFlags.reduce((acc, flag) => {
      acc[flag.featureKey] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      country: tenant.country,
      currency: tenant.currency,
      locale: tenant.locale,
      industry: tenant.industry ?? 'general',
      features,
    };

    const sub = tenant.subscription;
    const trialEndsAt = sub?.trialEndsAt ?? null;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        country: tenant.country,
        currency: tenant.currency,
        locale: tenant.locale,
        industry: tenant.industry ?? 'general',
        plan: sub?.plan?.name ?? 'starter',
      },
      subscription: {
        status: sub?.status ?? 'trialing',
        trialEndsAt,
        trialDaysLeft,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      },
      features,
    };
  }

  async register(data: {
    tenantName: string;
    tenantSlug: string;
    country: string;
    currency: string;
    locale: string;
    industry?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    });
    if (existing) throw new BadRequestException('El slug ya está en uso');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug,
          country: data.country,
          currency: data.currency,
          locale: data.locale,
          industry: data.industry ?? 'general',
          settings: {},
        },
      });

      const basicPlan = await tx.plan.findUnique({ where: { name: 'starter' } });
      if (basicPlan) {
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: basicPlan.id,
            status: 'trialing',
            trialEndsAt: trialEnd,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          },
        });
      }

      const defaultFlags = [
        { key: 'inventory', enabled: true },
        { key: 'restaurant_module', enabled: false },
        { key: 'pharmacy_module', enabled: false },
        { key: 'analytics', enabled: false },
        { key: 'multi_branch', enabled: false },
        { key: 'loyalty', enabled: false },
      ];

      for (const flag of defaultFlags) {
        await tx.featureFlag.create({
          data: { tenantId: tenant.id, featureKey: flag.key, enabled: flag.enabled },
        });
      }

      await tx.branch.create({
        data: { tenantId: tenant.id, name: 'Sucursal Principal' },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'admin',
        },
      });

      return { tenant, user };
    });

    return {
      message: `Cuenta creada exitosamente. Tienes ${TRIAL_DAYS} días de prueba gratuita.`,
      trialEndsAt: trialEnd,
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        currency: result.tenant.currency,
        country: result.tenant.country,
        locale: result.tenant.locale,
        industry: result.tenant.industry ?? 'general',
      },
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    };
  }

  async getProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            currency: true,
            locale: true,
            industry: true,
            settings: true,
            featureFlags: true,
            subscription: { include: { plan: true } },
          },
        },
      },
    });

    if (!user || user.tenant.id !== tenantId) throw new UnauthorizedException();

    const sub = (user.tenant as any).subscription;
    const trialEndsAt = sub?.trialEndsAt ?? null;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      ...user,
      tenant: {
        ...user.tenant,
        industry: user.tenant.industry ?? 'general',
        plan: sub?.plan?.name ?? 'starter',
      },
      subscription: {
        status: sub?.status ?? 'trialing',
        trialEndsAt,
        trialDaysLeft,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      },
    };
  }
}