export const XRAY_DEFAULT_CONFIG = {
    log: {
        loglevel: 'info',
    },
    inbounds: [
        {
            tag: 'Shadowsocks',
            port: 1234,
            protocol: 'shadowsocks',
            settings: {
                clients: [],
                method: 'chacha20-ietf-poly1305',
                network: 'tcp,udp',
            },
            sniffing: {
                enabled: true,
                destOverride: ['http', 'tls', 'quic'],
            },
        },
    ],
    outbounds: [
        {
            protocol: 'freedom',
            tag: 'DIRECT',
        },
        {
            protocol: 'blackhole',
            tag: 'BLOCK',
        },
    ],
    routing: {
        rules: [],
    },
};
