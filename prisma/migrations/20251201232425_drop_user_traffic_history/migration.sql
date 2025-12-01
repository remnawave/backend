-- DropForeignKey
ALTER TABLE "user_traffic_history" DROP CONSTRAINT "user_traffic_history_user_uuid_fkey";

-- DropTable
DROP TABLE "user_traffic_history";
