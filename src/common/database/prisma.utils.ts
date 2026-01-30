import { PoolConfig } from 'pg';

export function parsePrismaConnectionParams(connectionString: string): PoolConfig {
    const url = new URL(connectionString);
    const params = url.searchParams;
    const config: PoolConfig = {};

    // connection_limit -> max (pool size)
    const connectionLimit = params.get('connection_limit');
    if (connectionLimit) {
        config.max = parseInt(connectionLimit, 10);
    }

    // connect_timeout -> connectionTimeoutMillis
    const connectTimeout = params.get('connect_timeout');
    if (connectTimeout) {
        config.connectionTimeoutMillis = parseTimeToMs(connectTimeout);
    }

    // pool_timeout -> connectionTimeoutMillis (fallback if connect_timeout not set)
    const poolTimeout = params.get('pool_timeout');
    if (poolTimeout && !connectTimeout) {
        config.connectionTimeoutMillis = parseTimeToMs(poolTimeout);
    }

    // max_idle_connection_lifetime -> idleTimeoutMillis
    const maxIdleLifetime = params.get('max_idle_connection_lifetime');
    if (maxIdleLifetime) {
        config.idleTimeoutMillis = parseTimeToMs(maxIdleLifetime);
    }

    // max_connection_lifetime -> maxLifetimeSeconds
    const maxLifetime = params.get('max_connection_lifetime');
    if (maxLifetime) {
        config.maxLifetimeSeconds = parseTimeToSeconds(maxLifetime);
    }

    return config;
}

function parseTimeToMs(value: string): number {
    const match = value.match(/^(\d+)(s|ms)?$/);
    if (!match) return 0;
    const num = parseInt(match[1], 10);
    const unit = match[2] || 's';
    return unit === 'ms' ? num : num * 1000;
}

function parseTimeToSeconds(value: string): number {
    const match = value.match(/^(\d+)(s|ms)?$/);
    if (!match) return 0;
    const num = parseInt(match[1], 10);
    const unit = match[2] || 's';
    return unit === 'ms' ? Math.floor(num / 1000) : num;
}
