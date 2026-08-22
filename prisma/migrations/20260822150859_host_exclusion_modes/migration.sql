-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "internal_squads_mode" TEXT NOT NULL DEFAULT 'EXCLUDE';

-- RenameTable
ALTER TABLE "internal_squad_host_exclusions" RENAME TO "internal_squad_host_links";

-- RenameConstraint
ALTER TABLE "internal_squad_host_links" RENAME CONSTRAINT "internal_squad_host_exclusions_pkey" TO "internal_squad_host_links_pkey";

-- RenameConstraint
ALTER TABLE "internal_squad_host_links" RENAME CONSTRAINT "internal_squad_host_exclusions_host_uuid_fkey" TO "internal_squad_host_links_host_uuid_fkey";

-- RenameConstraint
ALTER TABLE "internal_squad_host_links" RENAME CONSTRAINT "internal_squad_host_exclusions_squad_uuid_fkey" TO "internal_squad_host_links_squad_uuid_fkey";
