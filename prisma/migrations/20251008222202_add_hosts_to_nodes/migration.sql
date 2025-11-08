-- AlterTable
ALTER TABLE "public"."admin" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."api_tokens" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."config_profiles" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."hwid_user_devices" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."infra_billing_nodes" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."infra_providers" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."internal_squads" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."keygen" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."nodes" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."nodes_traffic_usage_history" ALTER COLUMN "reset_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."nodes_usage_history" ALTER COLUMN "created_at" SET DEFAULT date_trunc('hour', now()),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."nodes_user_usage_history" ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."subscription_settings" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."subscription_templates" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."user_subscription_request_history" ALTER COLUMN "request_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."user_traffic_history" ALTER COLUMN "reset_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" SET DEFAULT now();

-- CreateTable
CREATE TABLE "public"."hosts_to_nodes" (
    "host_uuid" UUID NOT NULL,
    "node_uuid" UUID NOT NULL,

    CONSTRAINT "hosts_to_nodes_pkey" PRIMARY KEY ("host_uuid","node_uuid")
);

-- AddForeignKey
ALTER TABLE "public"."hosts_to_nodes" ADD CONSTRAINT "hosts_to_nodes_host_uuid_fkey" FOREIGN KEY ("host_uuid") REFERENCES "public"."hosts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hosts_to_nodes" ADD CONSTRAINT "hosts_to_nodes_node_uuid_fkey" FOREIGN KEY ("node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
