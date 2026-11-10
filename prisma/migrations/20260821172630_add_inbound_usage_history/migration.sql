-- CreateTable
CREATE TABLE "user_inbound_usage_history" (
    "inbound_uuid" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "total_bytes" BIGINT NOT NULL,
    "created_at" DATE NOT NULL DEFAULT CURRENT_DATE,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "user_inbound_usage_history_pkey" PRIMARY KEY ("inbound_uuid","created_at","user_id")
);

-- AddForeignKey
ALTER TABLE "user_inbound_usage_history" ADD CONSTRAINT "user_inbound_usage_history_inbound_uuid_fkey" FOREIGN KEY ("inbound_uuid") REFERENCES "config_profile_inbounds"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inbound_usage_history" ADD CONSTRAINT "user_inbound_usage_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
