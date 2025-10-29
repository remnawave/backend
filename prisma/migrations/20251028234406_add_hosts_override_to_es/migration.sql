-- AlterTable
ALTER TABLE "public"."external_squads" ADD COLUMN     "host_overrides" JSONB,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();
