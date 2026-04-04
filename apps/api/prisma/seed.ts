import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {

  // ── PLANES ──────────────────────────────────────────
  const starter = await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {
      displayName: 'Starter',
      priceMonthly: 29,
      features: {
        pos: true,
        inventory_basic: true,
        inventory_advanced: false,
        inventory_lots: false,
        multi_branch: false,
        analytics_basic: false,
        analytics_advanced: false,
        restaurant_module: false,
        pharmacy_module: false,
        loyalty: false,
        api_access: false,
        white_label: false,
        export_reports: false,
        max_branches: 1,
        max_users: 3,
      },
    },
    create: {
      name: 'starter',
      displayName: 'Starter',
      priceMonthly: 29,
      features: {
        pos: true,
        inventory_basic: true,
        inventory_advanced: false,
        inventory_lots: false,
        multi_branch: false,
        analytics_basic: false,
        analytics_advanced: false,
        restaurant_module: false,
        pharmacy_module: false,
        loyalty: false,
        api_access: false,
        white_label: false,
        export_reports: false,
        max_branches: 1,
        max_users: 3,
      },
    },
  });

  const growth = await prisma.plan.upsert({
    where: { name: 'growth' },
    update: {
      displayName: 'Growth',
      priceMonthly: 69,
      features: {
        pos: true,
        inventory_basic: true,
        inventory_advanced: true,
        inventory_lots: false,
        multi_branch: true,
        analytics_basic: true,
        analytics_advanced: false,
        restaurant_module: true,
        pharmacy_module: true,
        loyalty: false,
        api_access: false,
        white_label: false,
        export_reports: false,
        max_branches: 3,
        max_users: 15,
      },
    },
    create: {
      name: 'growth',
      displayName: 'Growth',
      priceMonthly: 69,
      features: {
        pos: true,
        inventory_basic: true,
        inventory_advanced: true,
        inventory_lots: false,
        multi_branch: true,
        analytics_basic: true,
        analytics_advanced: false,
        restaurant_module: true,
        pharmacy_module: true,
        loyalty: false,
        api_access: false,
        white_label: false,
        export_reports: false,
        max_branches: 3,
        max_users: 15,
      },
    },
  });

  const scale = await prisma.plan.upsert({
    where: { name: 'scale' },
    update: {
      displayName: 'Scale',
      priceMonthly: 149,
      features: {
        pos: true,
        inventory_basic: true,
        inventory_advanced: true,
        inventory_lots: true,
        multi_branch: true,
        analytics_basic: true,
        analytics_advanced: true,
        restaurant_module: true,
        pharmacy_module: true,
        loyalty: true,
        api_access: true,
        white_label: true,
        export_reports: true,
        max_branches: -1,
        max_users: -1,
      },
    },
    create: {
      name: 'scale',
      displayName: 'Scale',
      priceMonthly: 149,
      features: {
        pos: true,
        inventory_basic: true,
        inventory_advanced: true,
        inventory_lots: true,
        multi_branch: true,
        analytics_basic: true,
        analytics_advanced: true,
        restaurant_module: true,
        pharmacy_module: true,
        loyalty: true,
        api_access: true,
        white_label: true,
        export_reports: true,
        max_branches: -1,
        max_users: -1,
      },
    },
  });

  console.log('✅ Planes creados:', starter.displayName, growth.displayName, scale.displayName);

  // ── TENANT DEMO ──────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      country: 'CR',
      currency: 'CRC',
      locale: 'es-CR',
      settings: {},
    },
  });

  // Suscripción en plan Growth para el demo
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: { planId: growth.id, status: 'active' },
    create: { tenantId: tenant.id, planId: growth.id, status: 'active' },
  });

  // Feature flags según plan Growth
  const flags = [
    { key: 'pos',                  enabled: true  },
    { key: 'inventory_basic',      enabled: true  },
    { key: 'inventory_advanced',   enabled: true  },
    { key: 'inventory_lots',       enabled: false },
    { key: 'multi_branch',         enabled: true  },
    { key: 'analytics_basic',      enabled: true  },
    { key: 'analytics_advanced',   enabled: false },
    { key: 'restaurant_module',    enabled: true  },
    { key: 'pharmacy_module',      enabled: false },
    { key: 'loyalty',              enabled: false },
    { key: 'api_access',           enabled: false },
    { key: 'white_label',          enabled: false },
    { key: 'export_reports',       enabled: false },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: flag.key } },
      update: { enabled: flag.enabled },
      create: { tenantId: tenant.id, featureKey: flag.key, enabled: flag.enabled },
    });
  }

  // Sucursal demo
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-demo-001' },
    update: {},
    create: {
      id: 'branch-demo-001',
      tenantId: tenant.id,
      name: 'Sucursal Central',
      address: 'San José, Costa Rica',
    },
  });

  // Usuario admin demo
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Demo',
      role: UserRole.admin,
    },
  });

  console.log('✅ Seed completado');
  console.log(`   Tenant : ${tenant.name} (${tenant.slug})`);
  console.log(`   Plan   : ${growth.displayName} — $${growth.priceMonthly}/mes`);
  console.log(`   Branch : ${branch.name}`);
  console.log(`   Admin  : admin@demo.com / Admin123!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());