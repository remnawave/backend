-- AlterTable
ALTER TABLE "public"."external_squads" ADD COLUMN     "hwid_settings" JSONB,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."subscription_settings" ADD COLUMN     "hwid_settings" JSONB,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();