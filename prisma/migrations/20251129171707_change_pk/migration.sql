-- 1. Drop ALL FK
-- DropForeignKey
ALTER TABLE "hwid_user_devices" DROP CONSTRAINT "hwid_user_devices_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "internal_squad_members" DROP CONSTRAINT "internal_squad_members_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "nodes_user_usage_history" DROP CONSTRAINT "nodes_user_usage_history_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_subscription_request_history" DROP CONSTRAINT "user_subscription_request_history_user_uuid_fkey";

-- DropForeignKey
ALTER TABLE "user_traffic" DROP CONSTRAINT "user_traffic_t_id_fkey";

-- DropForeignKey
ALTER TABLE "user_traffic_history" DROP CONSTRAINT "user_traffic_history_user_uuid_fkey";

-- 2. Drop unique index on t_id  
DROP INDEX "users_t_id_key";

-- 3. Change PK
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("t_id");

-- 4. Create unique index on uuid
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- AddForeignKey
ALTER TABLE "user_traffic" ADD CONSTRAINT "user_traffic_t_id_fkey" FOREIGN KEY ("t_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes_user_usage_history" ADD CONSTRAINT "nodes_user_usage_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_traffic_history" ADD CONSTRAINT "user_traffic_history_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hwid_user_devices" ADD CONSTRAINT "hwid_user_devices_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_squad_members" ADD CONSTRAINT "internal_squad_members_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription_request_history" ADD CONSTRAINT "user_subscription_request_history_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;