import type { Cache } from 'cache-manager';

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';

import { CACHE_KEYS, CACHE_KEYS_TTL } from '@libs/contracts/constants';

import { RemnawaveSettingsRepository } from '@modules/remnawave-settings/repositories/remnawave-settings.repository';
import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

import { GetCachedRemnawaveSettingsQuery } from './get-cached-remnawave-settings.query';

@QueryHandler(GetCachedRemnawaveSettingsQuery)
export class GetCachedRemnawaveSettingsHandler implements IQueryHandler<
    GetCachedRemnawaveSettingsQuery,
    RemnawaveSettingsEntity
> {
    private readonly logger = new Logger(GetCachedRemnawaveSettingsHandler.name);
    constructor(
        private readonly remnawaveSettingsRepository: RemnawaveSettingsRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async execute(): Promise<RemnawaveSettingsEntity> {
        try {
            const cached = await this.cacheManager.get<RemnawaveSettingsEntity>(
                CACHE_KEYS.REMNAWAVE_SETTINGS,
            );
            if (cached) {
                return cached;
            }

            const settings = await this.remnawaveSettingsRepository.getSettings();

            await this.cacheManager.set(
                CACHE_KEYS.REMNAWAVE_SETTINGS,
                settings,
                CACHE_KEYS_TTL.REMNAWAVE_SETTINGS,
            );

            return settings;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
