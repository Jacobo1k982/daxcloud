-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxStock" INTEGER;

-- AlterTable
ALTER TABLE "movements" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "lotBarcode" TEXT,
ADD COLUMN     "lotNumber" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "unitCost" DECIMAL(10,2);
