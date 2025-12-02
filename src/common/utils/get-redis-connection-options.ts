export function getRedisConnectionOptions(
    socket: string | undefined,
    host: string | undefined,
    port: number | undefined,
    format: 'ioredis',
): { path: string } | { host: string; port: number };

export function getRedisConnectionOptions(
    socket: string | undefined,
    host: string | undefined,
    port: number | undefined,
    format: 'node-redis',
): { socket: { path: string; tls: boolean } } | { url: string };

export function getRedisConnectionOptions(
    socket: string | undefined,
    host: string | undefined,
    port: number | undefined,
    format: 'ioredis' | 'node-redis',
):
    | { path: string }
    | { host: string; port: number }
    | { socket: { path: string; tls: boolean } }
    | { url: string } {
    switch (format) {
        case 'ioredis':
            if (socket !== undefined && socket !== '') {
                return { path: socket };
            } else if (host !== undefined && port !== undefined) {
                return { host, port };
            } else {
                throw new Error('Either socket or host and port must be provided');
            }
        case 'node-redis':
            if (socket !== undefined && socket !== '') {
                return { socket: { path: socket, tls: false } };
            } else if (host !== undefined && port !== undefined) {
                return { url: `redis://${host}:${port}` };
            } else {
                throw new Error('Either socket or host and port must be provided');
            }
        default:
            throw new Error('Invalid format');
    }
}
