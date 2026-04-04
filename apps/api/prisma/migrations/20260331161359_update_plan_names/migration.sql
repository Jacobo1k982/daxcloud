/*
  Warnings:

  - The values [basic,pro,premium] on the enum `PlanName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanName_new" AS ENUM ('starter', 'growth', 'scale');
ALTER TABLE "plans" ALTER COLUMN "name" TYPE "PlanName_new" USING ("name"::text::"PlanName_new");
ALTER TYPE "PlanName" RENAME TO "PlanName_old";
ALTER TYPE "PlanName_new" RENAME TO "PlanName";
DROP TYPE "public"."PlanName_old";
COMMIT;
