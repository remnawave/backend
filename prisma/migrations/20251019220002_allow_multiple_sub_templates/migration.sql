/*
  Warnings:

  - A unique constraint covering the columns `[template_type,name]` on the table `subscription_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."subscription_templates_template_type_key";

-- AlterTable
ALTER TABLE "public"."subscription_templates" ADD COLUMN     "name" VARCHAR(255) NOT NULL DEFAULT 'Default',
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- CreateIndex
CREATE UNIQUE INDEX "subscription_templates_template_type_name_key" ON "public"."subscription_templates"("template_type", "name");
