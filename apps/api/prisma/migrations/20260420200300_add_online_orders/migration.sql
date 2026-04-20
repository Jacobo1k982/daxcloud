/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,code]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "creditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isCompany" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyLevel" TEXT NOT NULL DEFAULT 'bronze',
ADD COLUMN     "pointsExpiry" TIMESTAMP(3),
ADD COLUMN     "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "mixedPayments" JSONB;

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reference" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "type" TEXT NOT NULL DEFAULT 'pickup',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "notes" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_reference_key" ON "payment_requests"("reference");

-- CreateIndex
CREATE INDEX "payment_requests_tenantId_idx" ON "payment_requests"("tenantId");

-- CreateIndex
CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "online_orders_orderNumber_key" ON "online_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "online_orders_tenantId_status_idx" ON "online_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "online_orders_tenantId_createdAt_idx" ON "online_orders"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "clients_tenantId_idx" ON "clients"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tenantId_code_key" ON "clients"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_orders" ADD CONSTRAINT "online_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_orders" ADD CONSTRAINT "online_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
