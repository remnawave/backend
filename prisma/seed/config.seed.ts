import { Prisma, PrismaClient, RemnawaveSettings } from '@prisma/client';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import { hasher } from 'node-object-hash';
import utc from 'dayjs/plugin/utc';
import { Redis } from 'ioredis';
import consola from 'consola';
import dayjs from 'dayjs';
import _ from 'lodash';

import { generateJwtKeypair, generateMasterCerts } from '@common/utils/certs/generate-certs.util';
import { getRedisConnectionOptions } from '@common/utils';
import { XRayConfig } from '@common/helpers/xray-config';
import {
    CustomRemarksSchema,
    Oauth2SettingsSchema,
    PasskeySettingsSchema,
    TBrandingSettings,
    TCustomRemarks,
    THwidSettings,
    TOauth2Settings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
    TTgAuthSettings,
} from '@libs/contracts/models';
import {
    SUBPAGE_DEFAULT_CONFIG_NAME,
    SUBPAGE_DEFAULT_CONFIG_UUID,
} from '@libs/subscription-page/constants';
import {
    SUBSCRIPTION_TEMPLATE_TYPE,
    SUBSCRIPTION_TEMPLATE_TYPE_VALUES,
} from '@libs/contracts/constants';
import { SubscriptionPageRawConfigSchema } from '@libs/subscription-page/models';

import {
    DEFAULT_TEMPLATE_CLASH,
    DEFAULT_TEMPLATE_MIHOMO,
    DEFAULT_TEMPLATE_SINGBOX,
    DEFAULT_TEMPLATE_STASH,
    DEFAULT_TEMPLATE_XRAY_JSON,
} from '@modules/subscription-template/constants';
import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities/remnawave-settings.entity';
import { DEFAULT_SUBPAGE_CONFIG } from '@modules/subscription-page-configs/constants';
import { KeygenEntity } from '@modules/keygen/entities/keygen.entity';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);

const hash = hasher({
    trim: true,
    sort: {
        array: false,
        object: true,
    },
}).hash;

const DEFAULT_HWID_SETTINGS: THwidSettings = {
    enabled: false,
    fallbackDeviceLimit: 999,
    maxDevicesAnnounce: null,
};

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
    const migrationsToFix = [
        {
            migrationName: '20250822011918_add_tid',
            oldChecksum: '208f4ab9ad4d538853e2726fcc0c8733b2f5ddccfc80985d69bc2be2ecf017b4',
            newChecksum: '650c47ab960ed73efaf0b1fa7dd484f94b0d626d0c00944a2832431e1ee0a78b',
        },
    ];

    const migrationsToDelete = [
        '20251230045744_drop_is_custom_remark',
        '20260107133400_es_default_remarks',
    ];

    try {
        for (const { migrationName, oldChecksum, newChecksum } of migrationsToFix) {
            const result = await prisma.$executeRaw`
                UPDATE _prisma_migrations 
                SET checksum = ${newChecksum}
                WHERE migration_name = ${migrationName} 
                AND checksum = ${oldChecksum};
            `;
            if (result) {
                consola.info(`Migration "${migrationName}": updated ${result} rows`);
            }
        }

        for (const migrationName of migrationsToDelete) {
            await prisma.$executeRaw`
                DELETE FROM _prisma_migrations 
                WHERE migration_name = ${migrationName};
            `;
        }

        consola.success('🔐 Old migrations fixed!');
    } catch (error) {
        consola.error('🔐 Failed to fix old migrations:', error);
    }
}

async function checkupExternalSquads() {
    consola.start('Checking up external squads...');

    const fields: Array<{ name: string; strictObjectCheck?: boolean }> = [
        { name: 'custom_remarks', strictObjectCheck: true },
        { name: 'hwid_settings', strictObjectCheck: true },
        { name: 'subscription_settings' },
        { name: 'host_overrides' },
        { name: 'response_headers' },
    ];

    let total = 0;

    for (const { name, strictObjectCheck } of fields) {
        const whereClause = strictObjectCheck
            ? `"${name}" IS NOT NULL AND (jsonb_typeof("${name}") != 'object' OR "${name}" = '{}'::jsonb)`
            : `"${name}" IN ('null'::jsonb, '[]'::jsonb)`;

        const result = await prisma.$executeRawUnsafe(`
            UPDATE external_squads
            SET "${name}" = NULL
            WHERE ${whereClause};
        `);
        total += result;
        if (result > 0) consola.info(`"${name}": ${result} rows`);
    }

    consola.success(total > 0 ? `🔐 Total: ${total} rows fixed` : '🔐 Nothing to fix');
}

async function seedSubscriptionTemplate() {
    consola.start('Seeding subscription templates...');

    const deletedTemplates = await prisma.subscriptionTemplate.deleteMany({
        where: {
            templateType: {
                notIn: [...SUBSCRIPTION_TEMPLATE_TYPE_VALUES],
            },
        },
    });

    consola.success(`🔐 Deleted unknown templates: ${deletedTemplates.count}!`);

    for (const templateType of SUBSCRIPTION_TEMPLATE_TYPE_VALUES) {
        const existingConfig = await prisma.subscriptionTemplate.findUnique({
            where: {
                templateType_name: {
                    templateType,
                    name: 'Default',
                },
            },
        });

        switch (templateType) {
            case SUBSCRIPTION_TEMPLATE_TYPE.STASH:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, name: 'Default', templateYaml: DEFAULT_TEMPLATE_STASH },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.MIHOMO:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, name: 'Default', templateYaml: DEFAULT_TEMPLATE_MIHOMO },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.SINGBOX:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, name: 'Default', templateJson: DEFAULT_TEMPLATE_SINGBOX },
                });
                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.XRAY_JSON:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: {
                        templateType,
                        name: 'Default',
                        templateJson: DEFAULT_TEMPLATE_XRAY_JSON,
                    },
                });

                break;
            case SUBSCRIPTION_TEMPLATE_TYPE.CLASH:
                if (existingConfig) {
                    consola.info(`Default ${templateType} config already exists!`);
                    continue;
                }

                await prisma.subscriptionTemplate.create({
                    data: { templateType, name: 'Default', templateYaml: DEFAULT_TEMPLATE_CLASH },
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
    const customRemarks = {
        expiredUsers: ['⌛ Subscription expired', 'Contact support'],
        limitedUsers: ['🚧 Subscription limited', 'Contact support'],
        disabledUsers: ['🚫 Subscription disabled', 'Contact support'],
        emptyHosts: [
            '→ Remnawave',
            '→ No hosts found',
            '→ Check Hosts tab',
            '→ Check Internal Squads tab',
        ],
        HWIDMaxDevicesExceeded: ['Limit of devices reached'],
        HWIDNotSupported: ['App not supported'],
    } satisfies TCustomRemarks;

    const existingConfig = await prisma.subscriptionSettings.findFirst();

    if (existingConfig) {
        if (existingConfig.hwidSettings === null) {
            await prisma.subscriptionSettings.update({
                where: { uuid: existingConfig.uuid },
                data: { hwidSettings: DEFAULT_HWID_SETTINGS },
            });

            consola.success('🔐 Default HWID Settings have been seeded!');
        }

        if (existingConfig.customRemarks) {
            const existingRemarks = existingConfig.customRemarks as Partial<TCustomRemarks>;

            const needsUpdate =
                !('HWIDMaxDevicesExceeded' in existingRemarks) ||
                !('HWIDNotSupported' in existingRemarks);

            if (needsUpdate) {
                const mergedRemarks: TCustomRemarks = {
                    ...customRemarks,
                    ...existingRemarks,
                };

                await prisma.subscriptionSettings.update({
                    where: { uuid: existingConfig.uuid },
                    data: { customRemarks: mergedRemarks },
                });

                consola.success('🔐 Custom remarks updated with new fields.');

                return;
            }

            const isValid = await CustomRemarksSchema.safeParseAsync(existingConfig.customRemarks);
            if (!isValid.success) {
                await prisma.subscriptionSettings.update({
                    where: { uuid: existingConfig.uuid },
                    data: { customRemarks: customRemarks },
                });

                consola.success('🔐 Custom remarks updated!');
                return;
            }
        }

        consola.success('🔐 Custom remarks seeded!');
        return;
    }

    await prisma.subscriptionSettings.create({
        data: {
            profileTitle: 'Remnawave',
            supportLink: 'https://docs.rw',
            profileUpdateInterval: 12,
            isProfileWebpageUrlEnabled: true,
            serveJsonAtBaseSubscription: false,
            randomizeHosts: false,
            hwidSettings: DEFAULT_HWID_SETTINGS,
            isShowCustomRemarks: true,
            customRemarks,
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

                let createNewKeygen = false;

                if (count > 1) {
                    createNewKeygen = true;

                    consola.info('Deleting old keygen...');

                    await tx.keygen.deleteMany();
                }

                const existingConfig = await tx.keygen.findFirst({
                    orderBy: { createdAt: 'asc' },
                });

                if (!existingConfig) {
                    createNewKeygen = true;
                }

                if (createNewKeygen) {
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

            await prisma.configProfileInbounds.deleteMany({
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

async function seedRemnawaveSettings() {
    const DEFAULT_PASSKEY_SETTINGS: TRemnawavePasskeySettings = {
        enabled: false,
        rpId: null,
        origin: null,
    };

    const DEFAULT_OAUTH2_SETTINGS: TOauth2Settings = {
        github: {
            enabled: false,
            clientId: null,
            clientSecret: null,
            allowedEmails: [],
        },
        pocketid: {
            enabled: false,
            clientId: null,
            clientSecret: null,
            plainDomain: null,
            allowedEmails: [],
        },
        yandex: {
            enabled: false,
            clientId: null,
            clientSecret: null,
            allowedEmails: [],
        },
        keycloak: {
            enabled: false,
            realm: null,
            clientId: null,
            clientSecret: null,
            keycloakDomain: null,
            frontendDomain: null,
            allowedEmails: [],
        },
        generic: {
            enabled: false,
            clientId: null,
            clientSecret: null,
            withPkce: false,
            authorizationUrl: null,
            tokenUrl: null,
            frontendDomain: null,
            allowedEmails: [],
        },
    };

    const DEFAULT_TG_AUTH_SETTINGS: TTgAuthSettings = {
        enabled: false,
        botToken: null,
        adminIds: [],
    };

    const DEFAULT_PASSWORD_AUTH_SETTINGS: TPasswordAuthSettings = {
        enabled: true,
    };

    const settingsMapping = {
        passkeySettings: DEFAULT_PASSKEY_SETTINGS,
        oauth2Settings: DEFAULT_OAUTH2_SETTINGS,
        tgAuthSettings: DEFAULT_TG_AUTH_SETTINGS,
        passwordSettings: DEFAULT_PASSWORD_AUTH_SETTINGS,
    };

    const DEFAULT_BRANDING_SETTINGS: TBrandingSettings = {
        title: null,
        logoUrl: null,
    };

    const existingConfig = await prisma.remnawaveSettings.findFirst();
    if (existingConfig) {
        for (const [key, value] of Object.entries(settingsMapping)) {
            if (existingConfig[key as keyof RemnawaveSettings] === null) {
                await prisma.remnawaveSettings.update({
                    where: { id: existingConfig.id },
                    data: { [key]: value },
                });
            } else {
                if (key === 'oauth2Settings') {
                    const oauthSchemaParseResult = Oauth2SettingsSchema.safeParse(
                        existingConfig.oauth2Settings,
                    );
                    if (oauthSchemaParseResult.success) {
                        await prisma.remnawaveSettings.update({
                            where: { id: existingConfig.id },
                            data: { [key]: oauthSchemaParseResult.data },
                        });
                    }
                }

                if (key === 'passkeySettings') {
                    if (!PasskeySettingsSchema.safeParse(existingConfig.passkeySettings).success) {
                        consola.warn(`${key} is not valid! Falling back to default...`);
                        await prisma.remnawaveSettings.update({
                            where: { id: existingConfig.id },
                            data: { [key]: DEFAULT_PASSKEY_SETTINGS },
                        });
                        consola.success(`${key} updated to default!`);
                        consola.info('Enabling password authentication...');
                        await prisma.remnawaveSettings.update({
                            where: { id: existingConfig.id },
                            data: { passwordSettings: DEFAULT_PASSWORD_AUTH_SETTINGS },
                        });
                        consola.success('Password authentication enabled!');
                        continue;
                    }
                }
            }
        }
    }

    if (!existingConfig) {
        const defaultRemnawaveSettings = new RemnawaveSettingsEntity({
            passkeySettings: DEFAULT_PASSKEY_SETTINGS,
            oauth2Settings: DEFAULT_OAUTH2_SETTINGS,
            tgAuthSettings: DEFAULT_TG_AUTH_SETTINGS,
            passwordSettings: DEFAULT_PASSWORD_AUTH_SETTINGS,
            brandingSettings: DEFAULT_BRANDING_SETTINGS,
        });

        await prisma.remnawaveSettings.create({
            data: defaultRemnawaveSettings,
        });

        consola.success('🔐 Remnawave settings seeded!');

        return;
    }

    consola.success('🔐 Remnawave settings seeded!');
}

async function seedSubscriptionPageConfig() {
    const existingConfig = await prisma.subscriptionPageConfig.findUnique({
        where: {
            uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
        },
    });

    if (!existingConfig) {
        await prisma.subscriptionPageConfig.create({
            data: {
                uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
                name: SUBPAGE_DEFAULT_CONFIG_NAME,
                config: DEFAULT_SUBPAGE_CONFIG,
            },
        });

        consola.success('🔐 Subscription page config seeded!');

        return;
    } else {
        consola.success('🔐 Validating subpage configs...');

        const configList = await prisma.subscriptionPageConfig.findMany();

        for (const config of configList) {
            const validationResult = await SubscriptionPageRawConfigSchema.safeParseAsync(
                config.config,
            );

            if (!validationResult.success) {
                consola.log(`❌ Invalid subpage config: ${config.name} will be deleted!`);
                await prisma.subscriptionPageConfig.delete({
                    where: { uuid: config.uuid },
                });
            } else {
                await prisma.subscriptionPageConfig.update({
                    where: { uuid: config.uuid },
                    data: { config: validationResult.data },
                });
                consola.log(`✅ Valid subpage config: ${config.name} updated!`);
            }
        }

        const existingConfig = await prisma.subscriptionPageConfig.findUnique({
            where: {
                uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
            },
        });

        if (!existingConfig) {
            await prisma.subscriptionPageConfig.create({
                data: {
                    uuid: SUBPAGE_DEFAULT_CONFIG_UUID,
                    name: SUBPAGE_DEFAULT_CONFIG_NAME,
                    config: DEFAULT_SUBPAGE_CONFIG,
                },
            });
        }

        consola.success('🔐 Subpage configs validated!');
    }
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
            ...getRedisConnectionOptions(
                process.env.REDIS_SOCKET,
                process.env.REDIS_HOST,
                process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
                'ioredis',
            ),
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
            await checkupExternalSquads();
            await seedRemnawaveSettings();
            await seedSubscriptionTemplate();
            await seedDefaultConfigProfile();
            await syncInbounds();
            await seedDefaultInternalSquad();
            await seedSubscriptionSettings();
            await seedKeygen();
            await seedResponseRules();
            await seedSubscriptionPageConfig();
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
