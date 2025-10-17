-- Delete SINGBOX_LEGACY template type if exists
DELETE FROM "public"."subscription_templates" WHERE template_type = 'SINGBOX_LEGACY';


-- AlterTable
ALTER TABLE "public"."subscription_settings" ADD COLUMN     "response_rules" JSONB,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();