-- AlterTable
ALTER TABLE "public"."nodes" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];