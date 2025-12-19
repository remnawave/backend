-- AlterTable
ALTER TABLE "external_squads" ADD COLUMN     "subpage_config_uuid" UUID;

-- AddForeignKey
ALTER TABLE "external_squads" ADD CONSTRAINT "external_squads_subpage_config_uuid_fkey" FOREIGN KEY ("subpage_config_uuid") REFERENCES "subscription_page_config"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
