-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_last_connected_node_uuid_fkey";

-- CreateTable
CREATE TABLE "public"."user_traffic" (
    "t_id" BIGINT NOT NULL,
    "used_traffic_bytes" BIGINT NOT NULL DEFAULT 0,
    "lifetime_used_traffic_bytes" BIGINT NOT NULL DEFAULT 0,
    "online_at" TIMESTAMP(3),
    "last_connected_node_uuid" UUID,
    "first_connected_at" TIMESTAMP(3),

    CONSTRAINT "user_traffic_pkey" PRIMARY KEY ("t_id")
);


-- Insert data from users to user_traffic
INSERT INTO public."user_traffic" AS ut (
  "t_id",
  "used_traffic_bytes",
  "lifetime_used_traffic_bytes",
  "online_at",
  "last_connected_node_uuid",
  "first_connected_at"
)
SELECT
  u."t_id",
  COALESCE(u."used_traffic_bytes", 0),
  COALESCE(u."lifetime_used_traffic_bytes", 0),
  u."online_at",
  u."last_connected_node_uuid",
  u."first_connected_at"
FROM public."users" u
ON CONFLICT ("t_id") DO UPDATE SET
  "used_traffic_bytes" = GREATEST(ut."used_traffic_bytes", EXCLUDED."used_traffic_bytes"),
  "lifetime_used_traffic_bytes" = GREATEST(ut."lifetime_used_traffic_bytes", EXCLUDED."lifetime_used_traffic_bytes"),
  "online_at" = COALESCE(EXCLUDED."online_at", ut."online_at"),
  "last_connected_node_uuid" = COALESCE(EXCLUDED."last_connected_node_uuid", ut."last_connected_node_uuid"),
  "first_connected_at" = COALESCE(EXCLUDED."first_connected_at", ut."first_connected_at");


-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "first_connected_at",
DROP COLUMN "last_connected_node_uuid",
DROP COLUMN "lifetime_used_traffic_bytes",
DROP COLUMN "online_at",
DROP COLUMN "used_traffic_bytes";



-- AddForeignKey
ALTER TABLE "public"."user_traffic" ADD CONSTRAINT "user_traffic_t_id_fkey" FOREIGN KEY ("t_id") REFERENCES "public"."users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_traffic" ADD CONSTRAINT "user_traffic_last_connected_node_uuid_fkey" FOREIGN KEY ("last_connected_node_uuid") REFERENCES "public"."nodes"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
