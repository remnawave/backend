-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "external_squad_uuid" UUID,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- CreateTable
CREATE TABLE "public"."external_squads" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "external_squads_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."external_squads_templates" (
    "external_squad_uuid" UUID NOT NULL,
    "template_uuid" UUID NOT NULL,
    "template_type" TEXT NOT NULL,

    CONSTRAINT "external_squads_templates_pkey" PRIMARY KEY ("external_squad_uuid","template_type")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_squads_name_key" ON "public"."external_squads"("name");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_external_squad_uuid_fkey" FOREIGN KEY ("external_squad_uuid") REFERENCES "public"."external_squads"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_squads_templates" ADD CONSTRAINT "external_squads_templates_external_squad_uuid_fkey" FOREIGN KEY ("external_squad_uuid") REFERENCES "public"."external_squads"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_squads_templates" ADD CONSTRAINT "external_squads_templates_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."subscription_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
