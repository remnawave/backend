import { XRayConfig } from '@common/helpers/xray-config';
import { generateJwtKeypair, generateMasterCerts } from '@common/utils/certs/generate-certs.util';
import {
    SUBSCRIPTION_TEMPLATE_TYPE,
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
} from '@libs/contracts/constants';
import { KeygenEntity } from '@modules/keygen/entities/keygen.entity';
import { Prisma, PrismaClient } from '@prisma/client';
import consola from 'consola';
import _ from 'lodash';
import { Redis } from 'ioredis';
import { hasher } from 'node-object-hash';

const hash = hasher({
    trim: true,
    sort: {
        array: false,
        object: true,
    },
}).hash;

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
        rules: [],
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
            listen: '127.0.0.1',
            protocol: 'socks',
            settings: {
                udp: true,
                auth: 'noauth',
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
            listen: '127.0.0.1',
            protocol: 'http',
            settings: {
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

export const ResponseRulesDefaultConfig = {
    version: '1',
    rules: [
        {
            name: 'Browser Subscription',
            description: 'System critical: do not delete or disable this rule.',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'accept',
                    operator: 'CONTAINS',
                    value: 'text/html',
                    caseSensitive: true,
                },
            ],
            responseType: 'BROWSER',
        },
        {
            name: 'Mihomo Clients',
            description: 'Response with generated YAML config (Mihomo Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^(?:FlClash|FlClashX|Flowvy|[Cc]lash-[Vv]erge|[Kk]oala-[Cc]lash|[Cc]lash-?[Mm]eta|[Mm]urge|[Cc]lashX [Mm]eta|[Mm]ihomo|[Cc]lash-nyanpasu|clash.meta|prizrak-box)',
                    caseSensitive: false,
                },
            ],
            responseType: 'MIHOMO',
        },
        {
            name: 'Stash (iOS, macOS)',
            description: 'Response with generated YAML config (Stash Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^stash',
                    caseSensitive: false,
                },
            ],
            responseType: 'STASH',
        },
        {
            name: 'Sing-box clients',
            description: 'Resonse with generated JSON config (Singbox template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^sfa|sfi|sfm|sft|karing|singbox|rabbithole',
                    caseSensitive: false,
                },
            ],
            responseType: 'SINGBOX',
        },
        {
            name: 'Clash Core Clients',
            description: 'Response with generated YAML config (Clash Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^clash',
                    caseSensitive: false,
                },
            ],
            responseType: 'CLASH',
        },
        {
            name: 'Fallback Base64',
            description: 'System critical: do not delete or disable this rule.',
            enabled: true,
            operator: 'AND',
            conditions: [],
            responseType: 'XRAY_BASE64',
        },
    ],
};

export const PreviousResponseRulesConfigHash =
    '0c6711a63dc2571a9b7a69a5ae00219be616ac47d38f4c6e02caff8b3c7315b4';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function fixOldMigrations() {
    try {
        const query = Prisma.sql`
            UPDATE _prisma_migrations SET checksum = '650c47ab960ed73efaf0b1fa7dd484f94b0d626d0c00944a2832431e1ee0a78b' 
            WHERE migration_name = '20250822011918_add_tid' 
            AND checksum = '208f4ab9ad4d538853e2726fcc0c8733b2f5ddccfc80985d69bc2be2ecf017b4';
`;
        await prisma.$executeRaw(query);

        consola.success('🔐 Old migrations fixed!');
    } catch (error) {
        consola.error('🔐 Failed to fix old migrations:', error);
    }
}

async function seedSubscriptionTemplate() {
    consola.start('Seeding subscription templates...');
    for (const templateType of SUBSCRIPTION_TEMPLATE_TYPE_VALUES) {
        const existingConfig = await prisma.subscriptionTemplate.findUnique({
            where: {
                templateType,
            },
        });

        switch (templateType) {
            case SUBSCRIPTION_TEMPLATE_TYPE.STASH:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateYaml: StashDefaultConfig },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.MIHOMO:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateYaml: MihomoDefaultConfig },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateJson: SingboxDefaultConfig },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateJson: XrayJsonDefaultConfig },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.CLASH:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, templateYaml: ClashDefaultConfig },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.XRAY_BASE64:
                break;
            default:
                consola.error(`Unknown template type: ${templateType}`);
                process.exit(1);
        }
    }
}

async function seedSubscriptionSettings() {
    const existingConfig = await prisma.subscriptionSettings.findFirst();

    if (existingConfig) {
        consola.info('Default subscription settings already seeded!');
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
            isShowCustomRemarks: true,
            randomizeHosts: false,
        },
    });
}

async function seedResponseRules() {
    const existingConfig = await prisma.subscriptionSettings.findFirst();

    if (!existingConfig) {
        consola.error('🔐 Subscription settings not found!');
        process.exit(1);
    }

    if (existingConfig.responseRules === null) {
        consola.info('🔐 No response rules found! Seeding default response rules...');
        await prisma.subscriptionSettings.update({
            where: { uuid: existingConfig.uuid },
            data: { responseRules: ResponseRulesDefaultConfig },
        });

        consola.success('🔐 Default response rules seeded!');
        return;
    }

    consola.info('Existing SRR hash:', hash(existingConfig.responseRules));
    consola.info('Default SRR hash:', hash(ResponseRulesDefaultConfig));
    consola.info('Previous SRR hash:', PreviousResponseRulesConfigHash);

    if (PreviousResponseRulesConfigHash === hash(existingConfig.responseRules)) {
        consola.info('User have old default response rules... is default one is newer?');
        if (PreviousResponseRulesConfigHash !== hash(ResponseRulesDefaultConfig)) {
            consola.info(
                'Default response rules have been changed... updating to new default response rules...',
            );
            await prisma.subscriptionSettings.update({
                where: { uuid: existingConfig.uuid },
                data: { responseRules: ResponseRulesDefaultConfig },
            });
        }
    }

    consola.success('🔐 Response rules seeded!');
}

async function seedDefaultConfigProfile() {
    const existingConfig = await prisma.configProfiles.findFirst();

    if (existingConfig) {
        consola.info('Default config profile already seeded!');
        return;
    }

    const config = await prisma.configProfiles.create({
        data: {
            name: 'Default-Profile',
            config: XTLSDefaultConfig,
        },
    });
    if (!config) {
        consola.error('🔐 Failed to create default config profile!');
        process.exit(1);
    }

    await syncInbounds();

    const existingInternalSquad = await prisma.internalSquads.findFirst();

    // workaround for created squad from migration
    if (existingInternalSquad && existingInternalSquad.name === 'Default-Squad') {
        const configProfileInbounds = await prisma.configProfileInbounds.findMany({
            where: {
                profileUuid: config.uuid,
            },
        });

        if (configProfileInbounds.length === 0) {
            consola.info('🔐 No config profile inbounds found!');
            return;
        }

        const internalSquadInbounds = await prisma.internalSquadInbounds.createMany({
            data: configProfileInbounds.map((inbound) => ({
                inboundUuid: inbound.uuid,
                internalSquadUuid: existingInternalSquad.uuid,
            })),
        });

        if (!internalSquadInbounds) {
            consola.error('🔐 Failed to create default internal squad inbounds!');
            process.exit(1);
        }

        return;
    }

    consola.success('🔐 Default config profile seeded!');
}

async function seedDefaultInternalSquad() {
    const existingInternalSquad = await prisma.internalSquads.findFirst();
    const existingConfigProfile = await prisma.configProfiles.findFirst();

    if (!existingConfigProfile) {
        consola.error('🔐 Default config profile not found!');
        process.exit(1);
    }

    if (existingInternalSquad) {
        consola.info('🤔 Default internal squad already exists!');
        return;
    }

    const configProfileInbounds = await prisma.configProfileInbounds.findMany({
        where: {
            profileUuid: existingConfigProfile.uuid,
        },
    });

    if (configProfileInbounds.length === 0) {
        consola.error('🔐 No config profile inbounds found!');
        process.exit(1);
    }

    const res = await prisma.internalSquads.create({
        data: {
            name: 'Default-Squad',
            internalSquadInbounds: {
                create: configProfileInbounds.map((inbound) => ({
                    inboundUuid: inbound.uuid,
                })),
            },
        },
    });

    if (!res) {
        consola.error('🔐 Failed to create default internal squad!');
        process.exit(1);
    }

    consola.success('🔐 Default internal squad seeded!');
}
async function seedKeygen() {
    consola.start('🔐 Seeding keygen...');

    try {
        await prisma.$transaction(
            async (tx) => {
                const count = await tx.keygen.count();
                consola.info(`Keygen count: ${count}`);

                let IsNeedCreateNewKeygen = false;

                if (count > 1) {
                    IsNeedCreateNewKeygen = true;

                    consola.info('Deleting old keygen...');

                    await tx.keygen.deleteMany();
                }

                const existingConfig = await tx.keygen.findFirst({
                    orderBy: { createdAt: 'asc' },
                });

                if (!existingConfig) {
                    IsNeedCreateNewKeygen = true;
                }

                if (IsNeedCreateNewKeygen) {
                    const { publicKey, privateKey } = await generateJwtKeypair();
                    const { caCertPem, caKeyPem, clientCertPem, clientKeyPem } =
                        await generateMasterCerts();

                    const keygenEntity = new KeygenEntity({
                        caCert: caCertPem,
                        caKey: caKeyPem,
                        clientCert: clientCertPem,
                        clientKey: clientKeyPem,
                        pubKey: publicKey,
                        privKey: privateKey,
                    });

                    return await tx.keygen.create({
                        data: keygenEntity,
                    });
                }

                if (
                    existingConfig &&
                    existingConfig.pubKey &&
                    existingConfig.privKey &&
                    (!existingConfig.caCert ||
                        !existingConfig.caKey ||
                        !existingConfig.clientCert ||
                        !existingConfig.clientKey)
                ) {
                    try {
                        const { caCertPem, caKeyPem, clientCertPem, clientKeyPem } =
                            await generateMasterCerts();

                        await tx.keygen.update({
                            where: { uuid: existingConfig.uuid },
                            data: {
                                caCert: caCertPem,
                                caKey: caKeyPem,
                                clientCert: clientCertPem,
                                clientKey: clientKeyPem,
                            },
                        });

                        consola.success('🔐 Keygen updated!');
                        return;
                    } catch (error) {
                        consola.error('🔐 Failed to update keygen:', error);
                        process.exit(1);
                    }
                }

                return;
            },
            {
                timeout: 30000,
                isolationLevel: 'Serializable',
            },
        );

        consola.success('🔐 Keygen seeded!');
        return;
    } catch (error) {
        consola.error('🔐 Failed to seed keygen:', error);
        process.exit(1);
    }
}

async function syncInbounds() {
    consola.start('Syncing inbounds...');

    const configProfiles = await prisma.configProfiles.findMany();

    for (const configProfile of configProfiles) {
        consola.log(`Syncing inbounds for config profile: ${configProfile.name}`);

        const validatedConfig = new XRayConfig(configProfile.config as object);

        const configInbounds = validatedConfig.getAllInbounds();

        const existingInbounds = await prisma.configProfileInbounds.findMany({
            where: {
                profileUuid: configProfile.uuid,
            },
        });

        const inboundsToRemove = existingInbounds.filter((existingInbound) => {
            const configInbound = configInbounds.find((ci) => ci.tag === existingInbound.tag);
            return !configInbound || configInbound.type !== existingInbound.type;
        });

        const inboundsToAdd = configInbounds.filter((configInbound) => {
            if (!existingInbounds) {
                return true;
                // TODO: need additional checks
            }

            const existingInbound = existingInbounds.find((ei) => ei.tag === configInbound.tag);
            return !existingInbound || existingInbound.type !== configInbound.type;
        });

        if (inboundsToRemove.length) {
            const tagsToRemove = inboundsToRemove.map((inbound) => inbound.tag);
            consola.log(`Removing inbounds: ${tagsToRemove.join(', ')}`);

            const result = await prisma.configProfileInbounds.deleteMany({
                where: { uuid: { in: inboundsToRemove.map((inbound) => inbound.uuid) } },
            });
        }

        if (inboundsToAdd.length) {
            consola.log(`Adding inbounds: ${inboundsToAdd.map((i) => i.tag).join(', ')}`);
            await prisma.configProfileInbounds.createMany({
                data: inboundsToAdd.map((inbound) => ({
                    ...inbound,
                    rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
                    profileUuid: configProfile.uuid,
                })),
            });
        }

        if (inboundsToAdd.length === 0 && inboundsToRemove.length === 0) {
            const inboundsToUpdate = configInbounds
                .filter((configInbound) => {
                    if (!existingInbounds) {
                        return false;
                    }

                    const existingInbound = existingInbounds.find(
                        (ei) => ei.tag === configInbound.tag,
                    );

                    if (!existingInbound) {
                        return false;
                    }

                    const securityChanged = configInbound.security !== existingInbound.security;
                    const networkChanged = configInbound.network !== existingInbound.network;
                    const typeChanged = configInbound.type !== existingInbound.type;
                    const portChanged = configInbound.port !== existingInbound.port;
                    const rawInboundChanged = !_.isEqual(
                        configInbound.rawInbound,
                        existingInbound.rawInbound,
                    );

                    return (
                        securityChanged ||
                        networkChanged ||
                        typeChanged ||
                        portChanged ||
                        rawInboundChanged
                    );
                })
                .map((configInbound) => {
                    const existingInbound = existingInbounds.find(
                        (ei) => ei.tag === configInbound.tag,
                    );

                    if (!existingInbound) {
                        throw new Error(`Inbound with tag ${configInbound.tag} not found`);
                    }

                    existingInbound.security = configInbound.security;
                    existingInbound.network = configInbound.network;
                    existingInbound.type = configInbound.type;
                    existingInbound.port = configInbound.port;
                    existingInbound.rawInbound = configInbound.rawInbound;

                    return existingInbound;
                });

            if (inboundsToUpdate.length) {
                consola.log(`Updating inbounds: ${inboundsToUpdate.map((i) => i.tag).join(', ')}`);

                for (const inbound of inboundsToUpdate) {
                    await prisma.configProfileInbounds.update({
                        where: { uuid: inbound.uuid },
                        data: {
                            ...inbound,
                            rawInbound: inbound.rawInbound as Prisma.InputJsonValue,
                        },
                    });
                }
            }
        }
    }

    consola.success('Inbounds synced successfully');
}

async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        consola.success('Database connected!');
        return true;
    } catch (error) {
        consola.error('Database connection error:', error);
        process.exit(1);
    }
}

async function clearRedis() {
    consola.start('Clearing Redis...');

    try {
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'remnawave-redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            db: parseInt(process.env.REDIS_DB || '1', 10),
            password: process.env.REDIS_PASSWORD || undefined,
        });

        await redis.flushdb();
        await redis.quit();

        consola.success('Redis cleared successfully!');
    } catch (error) {
        consola.error('Redis clearing error:', error);

        consola.warn('Continuing without Redis clearing...');
    }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedAll() {
    let isConnected = false;

    // console.log('ResponseRulesDefaultConfig hash:', hash(ResponseRulesDefaultConfig));

    while (!isConnected) {
        isConnected = await checkDatabaseConnection();

        if (isConnected) {
            await clearRedis();
            consola.start('Database connected. Starting seeding...');
            await fixOldMigrations();
            await seedSubscriptionTemplate();
            await seedDefaultConfigProfile();
            await syncInbounds();
            await seedDefaultInternalSquad();
            await seedSubscriptionSettings();
            await seedKeygen();
            await seedResponseRules();
            break;
        } else {
            consola.info('Failed to connect to database. Retrying in 5 seconds...');
            await delay(5_000);
        }
    }
}

seedAll()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        consola.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
