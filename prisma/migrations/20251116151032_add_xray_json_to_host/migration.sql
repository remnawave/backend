-- AlterTable
ALTER TABLE "public"."hosts" ADD COLUMN     "xray_json_template_uuid" UUID;

-- AddForeignKey
ALTER TABLE "public"."hosts" ADD CONSTRAINT "hosts_xray_json_template_uuid_fkey" FOREIGN KEY ("xray_json_template_uuid") REFERENCES "public"."subscription_templates"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
