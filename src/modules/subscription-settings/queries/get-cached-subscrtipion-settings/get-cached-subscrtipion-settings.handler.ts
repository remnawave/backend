import type { Cache } from 'cache-manager';

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';

import { CACHE_KEYS, CACHE_KEYS_TTL } from '@libs/contracts/constants';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities';

import { SubscriptionSettingsRepository } from '../../repositories/subscription-settings.repository';
import { GetCachedSubscriptionSettingsQuery } from './get-cached-subscrtipion-settings.query';

@QueryHandler(GetCachedSubscriptionSettingsQuery)
export class GetCachedSubscriptionSettingsHandler
    implements IQueryHandler<GetCachedSubscriptionSettingsQuery>
{
    private readonly logger = new Logger(GetCachedSubscriptionSettingsHandler.name);

    constructor(
        private readonly subscriptionSettingsRepository: SubscriptionSettingsRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async execute() {
        try {
            const cached = await this.cacheManager.get<SubscriptionSettingsEntity>(
                CACHE_KEYS.SUBSCRIPTION_SETTINGS,
            );

            if (cached !== undefined) {
                return cached;
            }

            const settings = await this.subscriptionSettingsRepository.findFirst();

            if (!settings) {
                return null;
            }

            await this.cacheManager.set(
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
