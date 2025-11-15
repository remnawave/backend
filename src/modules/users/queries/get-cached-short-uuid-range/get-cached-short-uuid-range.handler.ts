import type { Cache } from 'cache-manager';

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';

import { CACHE_KEYS, CACHE_KEYS_TTL } from '@libs/contracts/constants';

import { GetCachedShortUuidRangeQuery } from './get-cached-short-uuid-range.query';
import { UsersRepository } from '../../repositories/users.repository';

@QueryHandler(GetCachedShortUuidRangeQuery)
export class GetCachedShortUuidRangeHandler implements IQueryHandler<GetCachedShortUuidRangeQuery> {
    private readonly logger = new Logger(GetCachedShortUuidRangeHandler.name);
    constructor(
        private readonly usersRepository: UsersRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async execute(query: GetCachedShortUuidRangeQuery) {
        try {
            if (!query.forceRefresh) {
                const cached = await this.cacheManager.get<{
                    min: number;
                    max: number;
                }>(CACHE_KEYS.SHORT_UUID_RANGE);

                if (cached) {
                    return cached;
                }
            }

            const shortUuidRange = await this.usersRepository.getShortUuidRange();

            await this.cacheManager.set(
                CACHE_KEYS.SHORT_UUID_RANGE,
                shortUuidRange,
                CACHE_KEYS_TTL.SHORT_UUID_RANGE,
            );

            return shortUuidRange;
        } catch (error) {
            this.logger.error(error);
            return {
                min: 0,
                max: 0,
            };
        }
    }
}
