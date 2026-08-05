-- AlterTable
ALTER TABLE "nodes" ADD COLUMN     "ips" JSONB NOT NULL DEFAULT '[]';
