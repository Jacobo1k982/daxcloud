-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingSteps" JSONB DEFAULT '{}';
