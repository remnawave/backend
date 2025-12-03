import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { HashedSet } from '@remnawave/hashed-set';

import { XRayConfig } from '@common/helpers/xray-config/xray-config.validator';
import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { GetConfigProfileByUuidQuery } from '@modules/config-profiles/queries/get-config-profile-by-uuid';
import { GetSnippetsQuery } from '@modules/config-profiles/queries/get-snippets';
import { UsersRepository } from '@modules/users/repositories/users.repository';

import {
    GetPreparedConfigWithUsersQuery,
    IGetPreparedConfigWithUsersResponse,
} from './get-prepared-config-with-users.query';

@QueryHandler(GetPreparedConfigWithUsersQuery)
export class GetPreparedConfigWithUsersHandler implements IQueryHandler<
    GetPreparedConfigWithUsersQuery,
    ICommandResponse<IGetPreparedConfigWithUsersResponse>
> {
    private readonly logger = new Logger(GetPreparedConfigWithUsersHandler.name);
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        query: GetPreparedConfigWithUsersQuery,
    ): Promise<ICommandResponse<IGetPreparedConfigWithUsersResponse>> {
        let config: XRayConfig | null = null;
        const inboundsUserSets: Map<string, HashedSet> = new Map();
        const snippetsMap: Map<string, unknown> = new Map();
        try {
            const { configProfileUuid, activeInbounds } = query;

            const configProfile = await this.queryBus.execute(
                new GetConfigProfileByUuidQuery(configProfileUuid),
            );

            const snippetsResponse = await this.queryBus.execute(new GetSnippetsQuery());

            if (!configProfile.isOk || !configProfile.response) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            if (!snippetsResponse.isOk || !snippetsResponse.response) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SERVER_ERROR,
                };
            }

            const snippets = snippetsResponse.response;

            for (const snippet of snippets) {
                snippetsMap.set(snippet.name, snippet.snippet);
            }

            const activeInboundsTags = new Set(activeInbounds.map((inbound) => inbound.tag));

            config = new XRayConfig(configProfile.response.config as object);

            config.cleanInboundClients();

            config.processCertificates();

            config.replaceSnippets(snippetsMap);

            const configHash = config.getConfigHash();

            config.leaveInbounds(activeInboundsTags);

            const usersStream = this.usersRepository.getUsersForConfigStream(activeInbounds);

            for await (const userBatch of usersStream) {
                config.includeUserBatch(userBatch, inboundsUserSets);
            }

            for (const [tag, set] of inboundsUserSets) {
                this.logger.debug(`Inbound ${tag}: hash ${set.hash64String} and ${set.size} users`);
            }

            return {
                isOk: true,
                response: {
                    config: config.getConfig(),
                    hashesPayload: {
                        emptyConfig: configHash,
                        inbounds: Array.from(inboundsUserSets.entries()).map(([tag, set]) => ({
                            usersCount: set.size,
                            hash: set.hash64String,
                            tag,
                        })),
                    },
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.INTERNAL_SERVER_ERROR,
            };
        } finally {
            config = null;
            for (const [, set] of inboundsUserSets) {
                set.clear();
            }
            inboundsUserSets.clear();
        }
    }
}
