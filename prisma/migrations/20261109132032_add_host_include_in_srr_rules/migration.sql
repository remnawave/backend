-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "include_in_srr_rules" TEXT[] DEFAULT ARRAY[]::TEXT[];
