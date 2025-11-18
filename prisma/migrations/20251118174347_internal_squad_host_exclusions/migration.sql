-- CreateTable
CREATE TABLE "public"."internal_squad_host_exclusions" (
    "host_uuid" UUID NOT NULL,
    "squad_uuid" UUID NOT NULL,

    CONSTRAINT "internal_squad_host_exclusions_pkey" PRIMARY KEY ("host_uuid","squad_uuid")
);

-- AddForeignKey
ALTER TABLE "public"."internal_squad_host_exclusions" ADD CONSTRAINT "internal_squad_host_exclusions_host_uuid_fkey" FOREIGN KEY ("host_uuid") REFERENCES "public"."hosts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."internal_squad_host_exclusions" ADD CONSTRAINT "internal_squad_host_exclusions_squad_uuid_fkey" FOREIGN KEY ("squad_uuid") REFERENCES "public"."internal_squads"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
