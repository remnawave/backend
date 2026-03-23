-- CreateIndex
CREATE INDEX "users_status_expire_at_idx" ON "users"("status", "expire_at");

-- CreateIndex
CREATE INDEX "users_traffic_limit_strategy_status_idx" ON "users"("traffic_limit_strategy", "status");

-- CreateIndex
CREATE INDEX "users_expire_at_idx" ON "users"("expire_at");

-- CreateIndex
CREATE INDEX "users_external_squad_uuid_idx" ON "users"("external_squad_uuid");

-- CreateIndex
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_traffic_online_at_idx" ON "user_traffic"("online_at");

-- CreateIndex
CREATE INDEX "hosts_config_profile_inbound_uuid_idx" ON "hosts"("config_profile_inbound_uuid");

-- CreateIndex
CREATE INDEX "internal_squad_inbounds_inbound_uuid_idx" ON "internal_squad_inbounds"("inbound_uuid");
