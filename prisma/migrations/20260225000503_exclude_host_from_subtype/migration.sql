-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "exclude_from_subscription_types" TEXT[] DEFAULT ARRAY[]::TEXT[];