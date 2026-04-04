-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'es',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "posPin" TEXT,
ADD COLUMN     "signature" TEXT,
ADD COLUMN     "timezone" TEXT DEFAULT 'America/Costa_Rica';
