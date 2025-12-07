-- AlterTable
ALTER TABLE "public"."config_profiles" ADD COLUMN     "view_position" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."external_squads" ADD COLUMN     "view_position" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."internal_squads" ADD COLUMN     "view_position" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."subscription_templates" ADD COLUMN     "view_position" SERIAL NOT NULL;