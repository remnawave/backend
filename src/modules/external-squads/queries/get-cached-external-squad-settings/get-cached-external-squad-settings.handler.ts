import type { Cache } from 'cache-manager';

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';

import { CACHE_KEYS, CACHE_KEYS_TTL } from '@libs/contracts/constants';

import { ExternalSquadRepository } from '@modules/external-squads/repositories/external-squad.repository';
import { ExternalSquadEntity } from '@modules/external-squads/entities';

import { GetCachedExternalSquadSettingsQuery } from './get-cached-external-squad-settings.query';

@QueryHandler(GetCachedExternalSquadSettingsQuery)
export class GetCachedExternalSquadSettingsHandler implements IQueryHandler<GetCachedExternalSquadSettingsQuery> {
    private readonly logger = new Logger(GetCachedExternalSquadSettingsHandler.name);
    constructor(
        private readonly externalSquadRepository: ExternalSquadRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async execute(query: GetCachedExternalSquadSettingsQuery) {
        try {
            const cached = await this.cacheManager.get<
                Pick<
                    ExternalSquadEntity,
                    | 'subscriptionSettings'
                    | 'hostOverrides'
                    | 'responseHeaders'
                    | 'hwidSettings'
                    | 'customRemarks'
                >
            >(CACHE_KEYS.EXTERNAL_SQUAD_SETTINGS(query.externalSquadUuid));

            if (cached) {
                return cached;
            }

            const result = await this.externalSquadRepository.getExternalSquadSettings(
                query.externalSquadUuid,
            );

            await this.cacheManager.set(
                CACHE_KEYS.EXTERNAL_SQUAD_SETTINGS(query.externalSquadUuid),
                result,
                CACHE_KEYS_TTL.EXTERNAL_SQUAD_SETTINGS,
            );

            return result;
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }
}
