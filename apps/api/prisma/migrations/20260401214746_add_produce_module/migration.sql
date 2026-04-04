-- CreateEnum
CREATE TYPE "FreshnessStatus" AS ENUM ('fresh', 'good', 'warning', 'critical', 'expired');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('kg', 'lb', 'g', 'oz', 'unidad', 'manojo', 'docena', 'caja');

-- CreateTable
CREATE TABLE "produce_products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'kg',
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "minTemperature" DECIMAL(5,2),
    "maxTemperature" DECIMAL(5,2),
    "shelfLifeDays" INTEGER NOT NULL DEFAULT 7,
    "origin" TEXT,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "seasonStart" INTEGER,
    "seasonEnd" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produce_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_lots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "produceProductId" TEXT NOT NULL,
    "branchId" TEXT,
    "supplierId" TEXT,
    "lotCode" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'kg',
    "unitCost" DECIMAL(10,2),
    "harvestDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "freshnessStatus" "FreshnessStatus" NOT NULL DEFAULT 'fresh',
    "temperature" DECIMAL(5,2),
    "origin" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvest_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produce_wastes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "harvestLotId" TEXT,
    "productId" TEXT,
    "branchId" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'kg',
    "reason" TEXT NOT NULL,
    "cost" DECIMAL(10,2),
    "reportedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produce_wastes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produce_price_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "produceProductId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produce_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_sections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "temperature" DECIMAL(5,2),
    "humidity" DECIMAL(5,2),
    "capacity" DECIMAL(10,2),
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produce_products_tenantId_productId_key" ON "produce_products"("tenantId", "productId");

-- AddForeignKey
ALTER TABLE "produce_products" ADD CONSTRAINT "produce_products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_products" ADD CONSTRAINT "produce_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_lots" ADD CONSTRAINT "harvest_lots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_lots" ADD CONSTRAINT "harvest_lots_produceProductId_fkey" FOREIGN KEY ("produceProductId") REFERENCES "produce_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_lots" ADD CONSTRAINT "harvest_lots_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_lots" ADD CONSTRAINT "harvest_lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_wastes" ADD CONSTRAINT "produce_wastes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_wastes" ADD CONSTRAINT "produce_wastes_harvestLotId_fkey" FOREIGN KEY ("harvestLotId") REFERENCES "harvest_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_wastes" ADD CONSTRAINT "produce_wastes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_wastes" ADD CONSTRAINT "produce_wastes_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_price_history" ADD CONSTRAINT "produce_price_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produce_price_history" ADD CONSTRAINT "produce_price_history_produceProductId_fkey" FOREIGN KEY ("produceProductId") REFERENCES "produce_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_sections" ADD CONSTRAINT "storage_sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_sections" ADD CONSTRAINT "storage_sections_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
