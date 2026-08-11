-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "mapper" JSONB NOT NULL DEFAULT '{}';
