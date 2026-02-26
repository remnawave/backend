-- AlterTable
ALTER TABLE "nodes" ADD COLUMN     "active_plugin_uuid" UUID,
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- CreateTable
CREATE TABLE "node_plugin" (
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "view_position" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "plugin_config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "node_plugin_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_active_plugin_uuid_fkey" FOREIGN KEY ("active_plugin_uuid") REFERENCES "node_plugin"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
