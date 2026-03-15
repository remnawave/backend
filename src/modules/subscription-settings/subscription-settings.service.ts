import { Injectable, Logger } from '@nestjs/common';

import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, ERRORS } from '@libs/contracts/constants';

import { SubscriptionSettingsRepository } from './repositories/subscription-settings.repository';
import { SubscriptionSettingsEntity } from './entities/subscription-settings.entity';
import { UpdateSubscriptionSettingsRequestDto } from './dtos';

@Injectable()
export class SubscriptionSettingsService {
    private readonly logger = new Logger(SubscriptionSettingsService.name);

    constructor(
        private readonly rawCacheService: RawCacheService,
        private readonly subscriptionSettingsRepository: SubscriptionSettingsRepository,
    ) {}

    public async getSubscriptionSettings(): Promise<TResult<SubscriptionSettingsEntity>> {
        try {
            const settings = await this.subscriptionSettingsRepository.findFirst();

            if (!settings) {
                return fail(ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND);
            }

            return ok(settings);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_SUBSCRIPTION_SETTINGS_ERROR);
        }
    }

    public async updateSettings(
        dto: UpdateSubscriptionSettingsRequestDto,
    ): Promise<TResult<SubscriptionSettingsEntity>> {
        try {
            const settings = await this.subscriptionSettingsRepository.findByUUID(dto.uuid);

            if (!settings) {
                return fail(ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND);
            }

            const updatedSettings = await this.subscriptionSettingsRepository.update({
                ...dto,
            });

            await this.rawCacheService.del(CACHE_KEYS.SUBSCRIPTION_SETTINGS);

            return ok(updatedSettings);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_SUBSCRIPTION_SETTINGS_ERROR);
        }
    }
}
