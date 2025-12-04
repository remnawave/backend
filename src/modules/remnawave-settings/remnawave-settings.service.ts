import type { Cache } from 'cache-manager';

import isEmail from 'validator/lib/isEmail';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { TResult } from '@common/types';
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

            return {
                isOk: true,
                response: settings,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_REMNAAWAVE_SETTINGS_ERROR,
            };
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
                return {
                    isOk: false,
                    ...ERRORS.VALIDATE_REMNAAWAVE_SETTINGS_ERROR.withMessage(
                        validationResult.error!,
                    ),
                };
            }

            await this.remnawaveSettingsRepository.update({
                ...body,
            });

            await this.cacheManager.del(CACHE_KEYS.REMNAWAVE_SETTINGS);

            return await this.getSettingsFromController();
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_REMNAAWAVE_SETTINGS_ERROR,
            };
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
                settings.oauth2Settings.pocketid,
                settings.oauth2Settings.yandex,
            ];

            // Test 1: At least one authentication method must be enabled
            if (
                !settings.passkeySettings.enabled &&
                !settings.oauth2Settings.github.enabled &&
                !settings.oauth2Settings.pocketid.enabled &&
                !settings.oauth2Settings.yandex.enabled &&
                !settings.tgAuthSettings.enabled &&
                !settings.passwordSettings.enabled
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

            // Test 5: Check up Telegram authentication
            if (settings.tgAuthSettings.enabled && !settings.tgAuthSettings.botToken) {
                return {
                    valid: false,
                    error: '[Telegram] Bot token must be set in order to use Telegram authentication.',
                };
            }

            // Test 6: If Telegram Auth enabled, check Bot Token is valid
            if (settings.tgAuthSettings.enabled && settings.tgAuthSettings.botToken) {
                const botTokenParts = settings.tgAuthSettings.botToken.split(':');
                if (botTokenParts.length !== 2) {
                    return {
                        valid: false,
                        error: '[Telegram] Bot token must be in the format "12334:EYXJ...".',
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

            // Test 8: Telegram Admin IDs must be not empty
            if (settings.tgAuthSettings.enabled && settings.tgAuthSettings.adminIds.length === 0) {
                return {
                    valid: false,
                    error: `[Telegram] Admin IDs must be set in order to use Telegram authentication.`,
                };
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
