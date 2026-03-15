import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { RawCacheService } from '@common/raw-cache';
import { CACHE_KEYS, CACHE_KEYS_TTL } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities';

import { SubscriptionSettingsRepository } from '../../repositories/subscription-settings.repository';
import { GetCachedSubscriptionSettingsQuery } from './get-cached-subscrtipion-settings.query';

@QueryHandler(GetCachedSubscriptionSettingsQuery)
export class GetCachedSubscriptionSettingsHandler implements IQueryHandler<GetCachedSubscriptionSettingsQuery> {
    private readonly logger = new Logger(GetCachedSubscriptionSettingsHandler.name);

    constructor(
        private readonly subscriptionSettingsRepository: SubscriptionSettingsRepository,
        private readonly rawCacheService: RawCacheService,
    ) {}

    async execute() {
        try {
            const cached = await this.rawCacheService.get<SubscriptionSettingsEntity>(
                CACHE_KEYS.SUBSCRIPTION_SETTINGS,
            );

            if (cached) {
                return cached;
            }

            const settings = await this.subscriptionSettingsRepository.findFirst();

            if (!settings) {
                return null;
            }

            await this.rawCacheService.set(
                CACHE_KEYS.SUBSCRIPTION_SETTINGS,
                settings,
                CACHE_KEYS_TTL.SUBSCRIPTION_SETTINGS,
            );

            return settings;
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }
}
