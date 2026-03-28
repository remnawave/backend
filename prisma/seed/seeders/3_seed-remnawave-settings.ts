import { PrismaClient, RemnawaveSettings } from '@prisma/client';
import consola from 'consola';

import {
    Oauth2SettingsSchema,
    PasskeySettingsSchema,
    TBrandingSettings,
    TOauth2Settings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
} from '@libs/contracts/models';

import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

export async function seedRemnawaveSettings(prisma: PrismaClient) {
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
        telegram: {
            enabled: false,
            clientId: null,
            clientSecret: null,
            allowedIds: [],
            frontendDomain: null,
        },
    };

    const DEFAULT_PASSWORD_AUTH_SETTINGS: TPasswordAuthSettings = {
        enabled: true,
    };

    const settingsMapping = {
        passkeySettings: DEFAULT_PASSKEY_SETTINGS,
        oauth2Settings: DEFAULT_OAUTH2_SETTINGS,
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
                        consola.success(`${key} updated to default`);
                        consola.info('Enabling password authentication...');
                        await prisma.remnawaveSettings.update({
                            where: { id: existingConfig.id },
                            data: { passwordSettings: DEFAULT_PASSWORD_AUTH_SETTINGS },
                        });
                        consola.success('Password authentication enabled');
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
            passwordSettings: DEFAULT_PASSWORD_AUTH_SETTINGS,
            brandingSettings: DEFAULT_BRANDING_SETTINGS,
        });

        await prisma.remnawaveSettings.create({
            data: defaultRemnawaveSettings,
        });

        consola.success('Remnawave settings seeded');

        return;
    }

    consola.success('Remnawave settings seeded');
}
