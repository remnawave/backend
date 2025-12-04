import { Cache } from 'cache-manager';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { TResult } from '@common/types';
import { CACHE_KEYS, ERRORS } from '@libs/contracts/constants';

import { SubscriptionSettingsRepository } from './repositories/subscription-settings.repository';
import { SubscriptionSettingsEntity } from './entities/subscription-settings.entity';
import { UpdateSubscriptionSettingsRequestDto } from './dtos';

@Injectable()
export class SubscriptionSettingsService {
    private readonly logger = new Logger(SubscriptionSettingsService.name);

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly subscriptionSettingsRepository: SubscriptionSettingsRepository,
    ) {}

    public async getSubscriptionSettings(): Promise<TResult<SubscriptionSettingsEntity>> {
        try {
            const settings = await this.subscriptionSettingsRepository.findFirst();

            if (!settings) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: settings,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_SUBSCRIPTION_SETTINGS_ERROR,
            };
        }
    }

    public async updateSettings(
        dto: UpdateSubscriptionSettingsRequestDto,
    ): Promise<TResult<SubscriptionSettingsEntity>> {
        try {
            const settings = await this.subscriptionSettingsRepository.findByUUID(dto.uuid);

            if (!settings) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND,
                };
            }

            const updatedSettings = await this.subscriptionSettingsRepository.update({
                ...dto,
            });

            await this.cacheManager.del(CACHE_KEYS.SUBSCRIPTION_SETTINGS);

            return {
                isOk: true,
                response: updatedSettings,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_SUBSCRIPTION_SETTINGS_ERROR,
            };
        }
    }
}
