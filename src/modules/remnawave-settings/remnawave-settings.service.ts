import type { Cache } from 'cache-manager';

import isEmail from 'validator/lib/isEmail';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, ERRORS } from '@libs/contracts/constants';

import { RemnawaveSettingsRepository } from './repositories/remnawave-settings.repository';
import { UpdateRemnawaveSettingsRequestDto } from './dto';
import { RemnawaveSettingsEntity } from './entities';

@Injectable()
export class RemnawaveSettingsService {
    private readonly logger = new Logger(RemnawaveSettingsService.name);
    constructor(
        private readonly remnawaveSettingsRepository: RemnawaveSettingsRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    public async getSettingsFromController(): Promise<TResult<RemnawaveSettingsEntity>> {
        try {
            const settings = await this.getSettings();

            return ok(settings);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_REMNAAWAVE_SETTINGS_ERROR);
        }
    }

    public async updateSettingsFromController(
        body: UpdateRemnawaveSettingsRequestDto,
    ): Promise<TResult<RemnawaveSettingsEntity>> {
        try {
            const settings = await this.remnawaveSettingsRepository.getSettings();

            const mergeSettings = new RemnawaveSettingsEntity({
                ...settings,
                ...body,
            });

            const validationResult = await this.validateSettings(mergeSettings);

            if (!validationResult.valid) {
                return fail(
                    ERRORS.VALIDATE_REMNAAWAVE_SETTINGS_ERROR.withMessage(validationResult.error!),
                );
            }

            await this.remnawaveSettingsRepository.update({
                ...body,
            });

            await this.cacheManager.del(CACHE_KEYS.REMNAWAVE_SETTINGS);

            return await this.getSettingsFromController();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_REMNAAWAVE_SETTINGS_ERROR);
        }
    }

    private async getSettings(): Promise<RemnawaveSettingsEntity> {
        return await this.remnawaveSettingsRepository.getSettings();
    }

    private async validateSettings(settings: RemnawaveSettingsEntity): Promise<{
        valid: boolean;
        error?: string;
    }> {
        try {
            const oauth2Providers = [
                settings.oauth2Settings.github,
                settings.oauth2Settings.yandex,
            ];

            const genericOAuth2Providers = [
                settings.oauth2Settings.pocketid,
                settings.oauth2Settings.keycloak,
                settings.oauth2Settings.generic,
            ];

            // Test 1: At least one authentication method must be enabled
            if (
                !settings.passkeySettings.enabled &&
                !settings.oauth2Settings.github.enabled &&
                !settings.oauth2Settings.pocketid.enabled &&
                !settings.oauth2Settings.yandex.enabled &&
                !settings.oauth2Settings.keycloak.enabled &&
                !settings.oauth2Settings.telegram.enabled &&
                !settings.passwordSettings.enabled &&
                !settings.oauth2Settings.generic.enabled
            ) {
                return {
                    valid: false,
                    error: 'At least one authentication method must be enabled',
                };
            }

            // Test 2: If passkey is enabled, rpId and origin must be set
            if (
                settings.passkeySettings.enabled &&
                (!settings.passkeySettings.rpId || !settings.passkeySettings.origin)
            ) {
                return {
                    valid: false,
                    error: '[Passkey] RP ID and origin must be set in order to use passkey authentication.',
                };
            }

            // Test 3: Check up required fields for OAuth2 authentication
            for (const provider of oauth2Providers) {
                if (provider.enabled && (!provider.clientId || !provider.clientSecret)) {
                    return {
                        valid: false,
                        error: `[OAuth2] ClientID and ClientSecret must be set in order to use authentication. Please set required fields or disable misconfigured OAuth2 provider.`,
                    };
                }
            }

            // Test 3.1: Check up required fields for Generic OAuth2 authentication
            for (const provider of genericOAuth2Providers) {
                if (provider.enabled && (!provider.clientId || !provider.clientSecret)) {
                    return {
                        valid: false,
                        error: `[OAuth2] ClientID and ClientSecret must be set in order to use authentication. Please set required fields or disable misconfigured OAuth2 provider.`,
                    };
                }
            }

            // Test 4: Check up required fields for PocketID authentication
            if (
                settings.oauth2Settings.pocketid.enabled &&
                !settings.oauth2Settings.pocketid.plainDomain
            ) {
                return {
                    valid: false,
                    error: '[PocketID] Plain domain must be set in order to use PocketID authentication.',
                };
            }

            // Test 4.1: Check up required fields for Keycloak authentication
            if (settings.oauth2Settings.keycloak.enabled) {
                if (
                    !settings.oauth2Settings.keycloak.frontendDomain ||
                    !settings.oauth2Settings.keycloak.keycloakDomain ||
                    !settings.oauth2Settings.keycloak.realm
                ) {
                    return {
                        valid: false,
                        error: '[Keycloak] Frontend domain, Keycloak domain and Realm must be set in order to use Keycloak authentication.',
                    };
                }
            }

            // Test 7: Oauth2 Emails array must be an array of valid emails
            for (const provider of oauth2Providers) {
                if (provider.enabled && provider.allowedEmails.length > 0) {
                    for (const email of provider.allowedEmails) {
                        if (!isEmail(email)) {
                            return {
                                valid: false,
                                error: `[OAuth2] Email ${email} is not a valid email address.`,
                            };
                        }
                    }
                }

                if (provider.enabled && provider.allowedEmails.length === 0) {
                    return {
                        valid: false,
                        error: `[OAuth2] At least one email must be set in order to use authentication. Please set required fields or disable misconfigured OAuth2 provider.`,
                    };
                }
            }

            // Test 8: Other OAuth2 providers with empty allowed emails array
            for (const provider of genericOAuth2Providers) {
                if (provider.enabled && provider.allowedEmails.length > 0) {
                    for (const email of provider.allowedEmails) {
                        if (!isEmail(email)) {
                            return {
                                valid: false,
                                error: `[OAuth2] Email ${email} is not a valid email address.`,
                            };
                        }
                    }
                }
            }

            // Test 10: Generic OAuth2 with PKCE must have authorization URL and token URL
            if (settings.oauth2Settings.generic.enabled) {
                if (
                    !settings.oauth2Settings.generic.authorizationUrl ||
                    !settings.oauth2Settings.generic.tokenUrl ||
                    !settings.oauth2Settings.generic.frontendDomain
                ) {
                    return {
                        valid: false,
                        error: `[Generic OAuth2] Authorization URL, token URL and frontend domain must be set in order to use Generic OAuth2 authentication.`,
                    };
                }
            }

            // Test 11: Telegram OAuth2 must have client ID, client secret and frontend domain
            if (settings.oauth2Settings.telegram.enabled) {
                if (
                    !settings.oauth2Settings.telegram.clientId ||
                    !settings.oauth2Settings.telegram.clientSecret ||
                    !settings.oauth2Settings.telegram.frontendDomain
                ) {
                    return {
                        valid: false,
                        error: `[Telegram OAuth2] Client ID, client secret and frontend domain must be set in order to use Telegram OAuth2 authentication.`,
                    };
                }

                if (settings.oauth2Settings.telegram.allowedIds.length === 0) {
                    return {
                        valid: false,
                        error: `[Telegram OAuth2] At least one admin ID must be set in order to use Telegram OAuth2 authentication.`,
                    };
                }
            }

            return {
                valid: true,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred',
            };
        }
    }
}
