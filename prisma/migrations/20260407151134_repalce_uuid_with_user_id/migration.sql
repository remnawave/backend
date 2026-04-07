-- =============================================
-- 1. hwid_user_devices: replace user_uuid with user_id
-- =============================================

-- If <= 100k records: migrate data smoothly
-- If > 100k records: truncate and start fresh
DO $$
DECLARE
    device_count BIGINT;
BEGIN
    SELECT count(*) INTO device_count FROM "hwid_user_devices";

    IF device_count <= 500000 THEN
        -- Add nullable column and populate from users
        ALTER TABLE "hwid_user_devices" ADD COLUMN "user_id" BIGINT;

        UPDATE "hwid_user_devices" h
        SET "user_id" = u."t_id"
        FROM "users" u
        WHERE u."uuid" = h."user_uuid";

        DELETE FROM "hwid_user_devices" WHERE "user_id" IS NULL;

        ALTER TABLE "hwid_user_devices" ALTER COLUMN "user_id" SET NOT NULL;
    ELSE
        TRUNCATE TABLE "hwid_user_devices";
        ALTER TABLE "hwid_user_devices" ADD COLUMN "user_id" BIGINT NOT NULL;
    END IF;
END $$;

ALTER TABLE "hwid_user_devices" DROP CONSTRAINT "hwid_user_devices_pkey";
ALTER TABLE "hwid_user_devices" DROP CONSTRAINT "hwid_user_devices_user_uuid_fkey";
ALTER TABLE "hwid_user_devices" DROP COLUMN "user_uuid";
ALTER TABLE "hwid_user_devices" ADD COLUMN "request_ip" TEXT;
ALTER TABLE "hwid_user_devices" ADD CONSTRAINT "hwid_user_devices_pkey" PRIMARY KEY ("hwid", "user_id");
ALTER TABLE "hwid_user_devices" ADD CONSTRAINT "hwid_user_devices_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- 2. user_subscription_request_history: always truncate
-- =============================================

TRUNCATE TABLE "user_subscription_request_history" RESTART IDENTITY;

ALTER TABLE "user_subscription_request_history" DROP CONSTRAINT "user_subscription_request_history_user_uuid_fkey";
DROP INDEX "user_subscription_request_history_user_uuid_idx";
ALTER TABLE "user_subscription_request_history" DROP COLUMN "user_uuid";
ALTER TABLE "user_subscription_request_history" ADD COLUMN "user_id" BIGINT NOT NULL;
CREATE INDEX "user_subscription_request_history_user_id_idx"
    ON "user_subscription_request_history"("user_id");
ALTER TABLE "user_subscription_request_history" ADD CONSTRAINT "user_subscription_request_history_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("t_id") ON DELETE CASCADE ON UPDATE CASCADE;
