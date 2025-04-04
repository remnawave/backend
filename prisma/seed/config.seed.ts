import {
    SUBSCRIPTION_TEMPLATE_TYPE,
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
} from '@libs/contracts/constants';
import { PrismaClient } from '@prisma/client';

export const XTLSDefaultConfig = {
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
        rules: [
            {
                ip: ['geoip:private'],
                outboundTag: 'BLOCK',
                type: 'field',
            },
            {
                domain: ['geosite:private'],
                outboundTag: 'BLOCK',
                type: 'field',
            },
            {
                protocol: ['bittorrent'],
                outboundTag: 'BLOCK',
                type: 'field',
            },
        ],
    },
};

export const MihomoDefaultConfig = `mixed-port: 7890
socks-port: 7891
redir-port: 7892
allow-lan: true
mode: global
log-level: info
external-controller: 127.0.0.1:9090
dns:
  enable: true
  use-hosts: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - 1.1.1.1
    - 8.8.8.8
  fake-ip-filter:
    - '*.lan'
    - stun.*.*.*
    - stun.*.*
    - time.windows.com
    - time.nist.gov
    - time.apple.com
    - time.asia.apple.com
    - '*.openwrt.pool.ntp.org'
    - pool.ntp.org
    - ntp.ubuntu.com
    - time1.apple.com
    - time2.apple.com
    - time3.apple.com
    - time4.apple.com
    - time5.apple.com
    - time6.apple.com
    - time7.apple.com
    - time1.google.com
    - time2.google.com
    - time3.google.com
    - time4.google.com
    - api.joox.com
    - joox.com
    - '*.xiami.com'
    - '*.msftconnecttest.com'
    - '*.msftncsi.com'
    - '+.xboxlive.com'
    - '*.*.stun.playstation.net'
    - xbox.*.*.microsoft.com
    - '*.ipv6.microsoft.com'
    - speedtest.cros.wr.pvp.net

proxies: # LEAVE THIS LINE!

proxy-groups:
  - name: '→ Remnawave'
    type: 'select'
    proxies: # LEAVE THIS LINE!

rules:
  - MATCH,→ Remnawave
`;

export const StashDefaultConfig = `proxy-groups:
  - name: → Remnawave
    type: select
    proxies: # LEAVE THIS LINE!

proxies: # LEAVE THIS LINE!

rules:
  - SCRIPT,quic,REJECT
  - DOMAIN-SUFFIX,iphone-ld.apple.com,DIRECT
  - DOMAIN-SUFFIX,lcdn-locator.apple.com,DIRECT
  - DOMAIN-SUFFIX,lcdn-registration.apple.com,DIRECT
  - DOMAIN-SUFFIX,push.apple.com,DIRECT
  - PROCESS-NAME,v2ray,DIRECT
  - PROCESS-NAME,Surge,DIRECT
  - PROCESS-NAME,ss-local,DIRECT
  - PROCESS-NAME,privoxy,DIRECT
  - PROCESS-NAME,trojan,DIRECT
  - PROCESS-NAME,trojan-go,DIRECT
  - PROCESS-NAME,naive,DIRECT
  - PROCESS-NAME,CloudflareWARP,DIRECT
  - PROCESS-NAME,Cloudflare WARP,DIRECT
  - IP-CIDR,162.159.193.0/24,DIRECT,no-resolve
  - PROCESS-NAME,p4pclient,DIRECT
  - PROCESS-NAME,Thunder,DIRECT
  - PROCESS-NAME,DownloadService,DIRECT
  - PROCESS-NAME,qbittorrent,DIRECT
  - PROCESS-NAME,Transmission,DIRECT
  - PROCESS-NAME,fdm,DIRECT
  - PROCESS-NAME,aria2c,DIRECT
  - PROCESS-NAME,Folx,DIRECT
  - PROCESS-NAME,NetTransport,DIRECT
  - PROCESS-NAME,uTorrent,DIRECT
  - PROCESS-NAME,WebTorrent,DIRECT
  - GEOIP,LAN,DIRECT
  - MATCH,→ Remnawave
script:
  shortcuts:
    quic: network == 'udp' and dst_port == 443
dns:
  default-nameserver:
    - 1.1.1.1
    - 1.0.0.1
  nameserver:
    - 1.1.1.1
    - 1.0.0.1
log-level: warning
mode: rule

`;

export const ClashDefaultConfig = `mixed-port: 7890
socks-port: 7891
redir-port: 7892
allow-lan: true
mode: global
log-level: info
external-controller: 127.0.0.1:9090
dns:
  enable: true
  use-hosts: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - 1.1.1.1
    - 8.8.8.8
  fake-ip-filter:
    - '*.lan'
    - stun.*.*.*
    - stun.*.*
    - time.windows.com
    - time.nist.gov
    - time.apple.com
    - time.asia.apple.com
    - '*.openwrt.pool.ntp.org'
    - pool.ntp.org
    - ntp.ubuntu.com
    - time1.apple.com
    - time2.apple.com
    - time3.apple.com
    - time4.apple.com
    - time5.apple.com
    - time6.apple.com
    - time7.apple.com
    - time1.google.com
    - time2.google.com
    - time3.google.com
    - time4.google.com
    - api.joox.com
    - joox.com
    - '*.xiami.com'
    - '*.msftconnecttest.com'
    - '*.msftncsi.com'
    - '+.xboxlive.com'
    - '*.*.stun.playstation.net'
    - xbox.*.*.microsoft.com
    - '*.ipv6.microsoft.com'
    - speedtest.cros.wr.pvp.net

proxies: # LEAVE THIS LINE!

proxy-groups:
  - name: '→ Remnawave'
    type: 'select'
    proxies: # LEAVE THIS LINE!

rules:
  - MATCH,→ Remnawave`;

export const SingboxLegacyDefaultConfig = {
    log: {
        disabled: true,
        level: 'debug',
        timestamp: true,
    },
    dns: {
        servers: [
            {
                tag: 'cf-dns',
                address: 'tls://1.1.1.1',
            },
            {
                tag: 'local',
                address: 'tcp://1.1.1.1',
                address_strategy: 'prefer_ipv4',
                strategy: 'ipv4_only',
                detour: 'direct',
            },
            {
                tag: 'remote',
                address: 'fakeip',
            },
        ],
        rules: [
            {
                query_type: ['A', 'AAAA'],
                server: 'remote',
            },
            {
                outbound: 'any',
                server: 'local',
            },
        ],
        fakeip: {
            enabled: true,
            inet4_range: '198.18.0.0/15',
            inet6_range: 'fc00::/18',
        },
        independent_cache: true,
    },
    inbounds: [
        {
            type: 'tun',
            mtu: 9000,
            interface_name: 'tun125',
            tag: 'tun-in',
            inet4_address: '172.19.0.1/30',
            inet6_address: 'fdfe:dcba:9876::1/126',
            auto_route: true,
            strict_route: true,
            endpoint_independent_nat: true,
            stack: 'mixed',
            sniff: true,
            platform: {
                http_proxy: {
                    enabled: true,
                    server: '127.0.0.1',
                    server_port: 2412,
                },
            },
        },
        {
            type: 'mixed',
            tag: 'mixed-in',
            listen: '127.0.0.1',
            listen_port: 2412,
            sniff: true,
            users: [],
            set_system_proxy: false,
        },
    ],
    outbounds: [
        {
            type: 'selector',
            tag: '→ Remnawave',
            interrupt_exist_connections: true,
            outbounds: null,
        },
        {
            type: 'direct',
            tag: 'direct',
        },
        {
            type: 'block',
            tag: 'block',
        },
        {
            type: 'dns',
            tag: 'dns-out',
        },
    ],
    route: {
        rules: [
            {
                type: 'logical',
                mode: 'or',
                rules: [
                    {
                        protocol: 'dns',
                    },
                    {
                        port: 53,
                    },
                ],
                outbound: 'dns-out',
            },
            {
                ip_is_private: true,
                outbound: 'direct',
            },
        ],
        auto_detect_interface: true,
        override_android_vpn: true,
    },
    experimental: {
        clash_api: {
            external_controller: '127.0.0.1:9090',
            external_ui: 'yacd',
            external_ui_download_url: 'https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip',
            external_ui_download_detour: 'direct',
            default_mode: 'rule',
        },
        cache_file: {
            enabled: true,
            path: 'remnawave.db',
            cache_id: 'remnawave',
            store_fakeip: true,
        },
    },
};

export const SingboxDefaultConfig = {
    log: {
        disabled: true,
        level: 'debug',
        timestamp: true,
    },
    dns: {
        servers: [
            {
                tag: 'cf-dns',
                address: 'tls://1.1.1.1',
            },
            {
                tag: 'local',
                address: 'tcp://1.1.1.1',
                address_strategy: 'prefer_ipv4',
                strategy: 'ipv4_only',
                detour: 'direct',
            },
            {
                tag: 'remote',
                address: 'fakeip',
            },
        ],
        rules: [
            {
                query_type: ['A', 'AAAA'],
                server: 'remote',
            },
            {
                outbound: 'any',
                server: 'local',
            },
        ],
        fakeip: {
            enabled: true,
            inet4_range: '198.18.0.0/15',
            inet6_range: 'fc00::/18',
        },
        independent_cache: true,
    },
    inbounds: [
        {
            type: 'tun',
            mtu: 9000,
            interface_name: 'tun125',
            tag: 'tun-in',
            inet4_address: '172.19.0.1/30',
            inet6_address: 'fdfe:dcba:9876::1/126',
            auto_route: true,
            strict_route: true,
            endpoint_independent_nat: true,
            stack: 'mixed',
            sniff: true,
            platform: {
                http_proxy: {
                    enabled: true,
                    server: '127.0.0.1',
                    server_port: 2412,
                },
            },
        },
        {
            type: 'mixed',
            tag: 'mixed-in',
            listen: '127.0.0.1',
            listen_port: 2412,
            sniff: true,
            users: [],
            set_system_proxy: false,
        },
    ],
    outbounds: [
        {
            type: 'selector',
            tag: '→ Remnawave',
            interrupt_exist_connections: true,
            outbounds: null,
        },
        {
            type: 'direct',
            tag: 'direct',
        },
    ],
    route: {
        rules: [
            {
                action: 'sniff',
            },
            {
                type: 'logical',
                mode: 'or',
                rules: [
                    {
                        protocol: 'dns',
                    },
                    {
                        port: 53,
                    },
                ],
                action: 'hijack-dns',
            },
            {
                ip_is_private: true,
                outbound: 'direct',
            },
        ],
        auto_detect_interface: true,
        override_android_vpn: true,
    },
    experimental: {
        clash_api: {
            external_controller: '127.0.0.1:9090',
            external_ui: 'yacd',
            external_ui_download_url: 'https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip',
            external_ui_download_detour: 'direct',
            default_mode: 'rule',
        },
        cache_file: {
            enabled: true,
            path: 'remnawave.db',
            cache_id: 'remnawave',
            store_fakeip: true,
        },
    },
};

export const XrayJsonDefaultConfig = {
    dns: {
        servers: ['1.1.1.1', '1.0.0.1'],
        queryStrategy: 'UseIP',
    },
    routing: {
        rules: [
            {
                type: 'field',
                protocol: ['bittorrent'],
                outboundTag: 'direct',
            },
        ],
        domainMatcher: 'hybrid',
        domainStrategy: 'IPIfNonMatch',
    },
    inbounds: [
        {
            tag: 'socks',
            port: 10808,
            listen: '[::1]',
            protocol: 'socks',
            settings: {
                udp: true,
                auth: 'noauth',
                allowTransparent: false,
            },
            sniffing: {
                enabled: true,
                routeOnly: false,
                destOverride: ['http', 'tls', 'quic'],
            },
        },
        {
            tag: 'http',
            port: 10809,
            listen: '[::1]',
            protocol: 'http',
            settings: {
                udp: true,
                auth: 'noauth',
                allowTransparent: false,
            },
            sniffing: {
                enabled: true,
                routeOnly: false,
                destOverride: ['http', 'tls', 'quic'],
            },
        },
    ],
    outbounds: [
        {
            tag: 'direct',
            protocol: 'freedom',
        },
        {
            tag: 'block',
            protocol: 'blackhole',
        },
    ],
};

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function seedSubscriptionTemplate() {
    console.log('Seeding subscription templates...');
    for (const templateType of SUBSCRIPTION_TEMPLATE_TYPE_VALUES) {
        const existingConfig = await prisma.subscriptionTemplate.findUnique({
            where: {
                templateType,
            },
        });

        switch (templateType) {
            case SUBSCRIPTION_TEMPLATE_TYPE.STASH:
                if (existingConfig) {
                    console.log(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateYaml: StashDefaultConfig },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.MIHOMO:
                if (existingConfig) {
                    console.log(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateYaml: MihomoDefaultConfig },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX:
                if (existingConfig) {
                    console.log(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateJson: SingboxDefaultConfig },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX_LEGACY:
                if (existingConfig) {
                    console.log(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateJson: SingboxLegacyDefaultConfig },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON:
                if (existingConfig) {
                    console.log(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateJson: XrayJsonDefaultConfig },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.CLASH:
                if (existingConfig) {
                    console.log(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateYaml: ClashDefaultConfig },
                });

                break;
            default:
                throw new Error(`Unknown template type: ${templateType}`);
        }
    }
}

async function seedSubscriptionSettings() {
    const existingConfig = await prisma.subscriptionSettings.findFirst();

    if (existingConfig) {
        console.log('Default subscription settings already seeded!');
        return;
    }

    const expiredUserRemarks = ['🚨 Subscription expired', 'Contact support'];
    const disabledUserRemarks = ['❌ Subscription disabled', 'Contact support'];
    const limitedUserRemarks = ['🔴 Subscription limited', 'Contact support'];

    await prisma.subscriptionSettings.create({
        data: {
            profileTitle: 'Remnawave',
            supportLink: 'https://remna.st',
            profileUpdateInterval: 12,
            isProfileWebpageUrlEnabled: true,
            expiredUsersRemarks: expiredUserRemarks,
            limitedUsersRemarks: limitedUserRemarks,
            disabledUsersRemarks: disabledUserRemarks,
            serveJsonAtBaseSubscription: false,
            addUsernameToBaseSubscription: false,
        },
    });
}

async function seedConfigVariables() {
    const existingConfig = await prisma.xrayConfig.findFirst();

    if (existingConfig) {
        console.log('Default XTLS config already seeded!');
        return;
    }

    const config = await prisma.xrayConfig.create({
        data: {
            config: XTLSDefaultConfig,
        },
    });

    if (!config) {
        throw new Error('Failed to create default config!');
    }

    console.log('Default XTLS config seeded!');
}

async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('Database connected!');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedAll() {
    let isConnected = false;

    while (!isConnected) {
        isConnected = await checkDatabaseConnection();

        if (isConnected) {
            console.log('Database connected. Starting seeding...');
            await seedSubscriptionTemplate();
            await seedConfigVariables();
            await seedSubscriptionSettings();
            break;
        } else {
            console.log('Failed to connect to database. Retrying in 5 seconds...');
            await delay(5_000);
        }
    }
}

seedAll()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
