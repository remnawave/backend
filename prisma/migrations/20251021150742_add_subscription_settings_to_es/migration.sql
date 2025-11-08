-- AlterTable
ALTER TABLE "public"."external_squads" ADD COLUMN     "subscription_settings" JSONB,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();
