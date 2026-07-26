--
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_active_config_idx
    ON users (id)
    INCLUDE (vless_uuid, trojan_password, ss_password)
    WHERE status = 'ACTIVE';