import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { ExportsModule } from './modules/exports/exports.module';
import { BillingModule } from './modules/billing/billing.module';
import { RolesModule } from './modules/roles/roles.module';
import { EmailModule } from './modules/email/email.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BakeryModule } from './modules/bakery/bakery.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { SalonModule } from './modules/salon/salon.module';
import { ClothingModule } from './modules/clothing/clothing.module';
import { ProduceModule } from './modules/produce/produce.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SubscriptionGuard } from './modules/auth/guards/subscription.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    ProductsModule,
    SalesModule,
    InventoryModule,
    UploadsModule,
    UsersModule,
    ExportsModule,
    BillingModule,
    RolesModule,
    EmailModule,
    AnalyticsModule,
    BakeryModule,
    PharmacyModule,
    SalonModule,
    ClothingModule,
    ProduceModule,
    RestaurantModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule { }