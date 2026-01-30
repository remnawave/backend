import _ from 'lodash';

import { Prisma } from '@generated/prisma/client';

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { XRayConfig } from '@common/helpers/xray-config';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants/errors';

import { NodesQueuesService } from '@queue/_nodes';

import { GetConfigProfileByUuidResponseModel } from './models/get-config-profile-by-uuid.response.model';
import { DeleteConfigProfileByUuidResponseModel, GetAllInboundsResponseModel } from './models';
import { GetConfigProfilesResponseModel } from './models/get-config-profiles.response.model';
import { ConfigProfileInboundEntity } from './entities/config-profile-inbound.entity';
import { ConfigProfileRepository } from './repositories/config-profile.repository';
import { ConfigProfileEntity } from './entities/config-profile.entity';
import { ConfigProfileWithInboundsAndNodesEntity } from './entities';
import { GetSnippetsQuery } from './queries/get-snippets';
import { ReorderConfigProfilesRequestDto } from './dtos';

@Injectable()
export class ConfigProfileService {
    private readonly logger = new Logger(ConfigProfileService.name);

    constructor(
        private readonly configProfileRepository: ConfigProfileRepository,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly queryBus: QueryBus,
    ) {}

    public async getConfigProfiles(): Promise<TResult<GetConfigProfilesResponseModel>> {
        try {
            const configProfiles = await this.configProfileRepository.getAllConfigProfiles();

            for (const configProfile of configProfiles) {
                configProfile.config = new XRayConfig(
                    configProfile.config as object,
                ).getSortedConfig();
            }

            const total = await this.configProfileRepository.getTotalConfigProfiles();

            return ok(new GetConfigProfilesResponseModel(configProfiles, total));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_CONFIG_PROFILES_ERROR);
        }
    }

    public async getConfigProfileByUUID(
        uuid: string,
    ): Promise<TResult<GetConfigProfileByUuidResponseModel>> {
        try {
            const configProfile = await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!configProfile) {
                return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);
            }

            configProfile.config = new XRayConfig(configProfile.config as object).getSortedConfig();

            return ok(new GetConfigProfileByUuidResponseModel(configProfile));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_CONFIG_PROFILE_BY_UUID_ERROR);
        }
    }

    public async getComputedConfigProfileByUUID(
        uuid: string,
    ): Promise<TResult<GetConfigProfileByUuidResponseModel>> {
        try {
            const configProfile = await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!configProfile) {
                return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);
            }

            const snippetsMap: Map<string, unknown> = new Map();
            const snippetsResponse = await this.queryBus.execute(new GetSnippetsQuery());

            if (!snippetsResponse.isOk) {
                return fail(ERRORS.INTERNAL_SERVER_ERROR);
            }

            for (const snippet of snippetsResponse.response) {
                snippetsMap.set(snippet.name, snippet.snippet);
            }

            const config = new XRayConfig(configProfile.config as object);
            config.replaceSnippets(snippetsMap);

            configProfile.config = config.getSortedConfig();

            return ok(new GetConfigProfileByUuidResponseModel(configProfile));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_COMPUTED_CONFIG_PROFILE_BY_UUID_ERROR);
        }
    }

    public async deleteConfigProfileByUUID(
        uuid: string,
    ): Promise<TResult<DeleteConfigProfileByUuidResponseModel>> {
        try {
            const configProfile = await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!configProfile) {
                return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);
            }

            for (const node of configProfile.nodes) {
                await this.nodesQueuesService.stopNode({
                    nodeUuid: node.uuid,
                    isNeedToBeDeleted: false,
                });
            }

            const result = await this.configProfileRepository.deleteByUUID(uuid);

            return ok(new DeleteConfigProfileByUuidResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_CONFIG_PROFILE_BY_UUID_ERROR);
        }
    }

    public async createConfigProfile(
        name: string,
        config: object,
    ): Promise<TResult<GetConfigProfileByUuidResponseModel>> {
        try {
            if (name === 'Default-Profile') {
                return fail(ERRORS.RESERVED_CONFIG_PROFILE_NAME);
            }

            const validatedConfig = new XRayConfig(config);
            const sortedConfig = validatedConfig.getSortedConfig();

            const profileEntity = new ConfigProfileEntity({
                name,
                config: sortedConfig as object,
            });

            const inbounds = validatedConfig.getAllInbounds();

            const inboundsEntities = inbounds.map(
                (inbound) =>
                    new ConfigProfileInboundEntity({
                        tag: inbound.tag,
                        type: inbound.type,
                        network: inbound.network,
                        security: inbound.security,
                        port: inbound.port,
                        rawInbound: inbound.rawInbound as unknown as object,
                    }),
            );

            const { uuid } = await this.configProfileRepository.create(
                profileEntity,
                inboundsEntities,
            );

            return await this.getConfigProfileByUUID(uuid);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                (error.meta?.modelName === 'ConfigProfileInbounds' ||
                    error.meta?.modelName === 'ConfigProfiles') &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('tag')) {
                    return fail(ERRORS.INBOUNDS_WITH_SAME_TAG_ALREADY_EXISTS);
                }
                if (fields.includes('name')) {
                    return fail(ERRORS.CONFIG_PROFILE_NAME_ALREADY_EXISTS);
                }
            }
            this.logger.error(error);
            return fail(ERRORS.CREATE_CONFIG_PROFILE_ERROR);
        }
    }

    public async updateConfigProfile(
        uuid: string,
        name?: string,
        config?: object,
    ): Promise<TResult<GetConfigProfileByUuidResponseModel>> {
        try {
            const existingConfigProfile =
                await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!existingConfigProfile) {
                return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);
            }

            if (!name && !config) {
                return fail(ERRORS.NAME_OR_CONFIG_REQUIRED);
            }

            await this.updateConfigProfileTransactional(existingConfigProfile, uuid, name, config);

            if (config) {
                // No need for now
                // await this.commandBus.execute(new SyncActiveProfileCommand());

                await this.nodesQueuesService.startAllNodesByProfile({
                    profileUuid: existingConfigProfile.uuid,
                    emitter: 'updateConfigProfile',
                });
            }

            return this.getConfigProfileByUUID(existingConfigProfile.uuid);
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                (error.meta?.modelName === 'ConfigProfileInbounds' ||
                    error.meta?.modelName === 'ConfigProfiles') &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('tag')) {
                    return fail(ERRORS.INBOUNDS_WITH_SAME_TAG_ALREADY_EXISTS);
                }
                if (fields.includes('name')) {
                    return fail(ERRORS.CONFIG_PROFILE_NAME_ALREADY_EXISTS);
                }
            }

            if (error instanceof Error) {
                return fail(ERRORS.CONFIG_VALIDATION_ERROR.withMessage(error.message));
            }

            return fail(ERRORS.UPDATE_CONFIG_PROFILE_ERROR);
        }
    }

    @Transactional()
    public async updateConfigProfileTransactional(
        existingConfigProfile: ConfigProfileWithInboundsAndNodesEntity,
        uuid: string,
        name?: string,
        config?: object,
    ): Promise<boolean> {
        try {
            const configProfileEntity = new ConfigProfileEntity({
                uuid,
                name,
            });

            if (config) {
                const existingInbounds = existingConfigProfile.inbounds;

                const validatedConfig = new XRayConfig(config);
                validatedConfig.cleanClients();
                validatedConfig.fixIncorrectServerNames();
                const sortedConfig = validatedConfig.getSortedConfig();
                const inbounds = validatedConfig.getAllInbounds();

                const inboundsEntities = inbounds.map(
                    (inbound) =>
                        new ConfigProfileInboundEntity({
                            profileUuid: existingConfigProfile.uuid,
                            tag: inbound.tag,
                            type: inbound.type,
                            network: inbound.network,
                            security: inbound.security,
                            port: inbound.port,
                            rawInbound: inbound.rawInbound as unknown as object,
                        }),
                );

                await this.syncInbounds(existingInbounds, inboundsEntities);

                configProfileEntity.config = sortedConfig as object;
            }

            await this.configProfileRepository.update(configProfileEntity);

            return true;
        } catch (error) {
            throw error;
        }
    }

    public async getInboundsByProfileUuid(
        profileUuid: string,
    ): Promise<TResult<GetAllInboundsResponseModel>> {
        try {
            const configProfile =
                await this.configProfileRepository.getConfigProfileByUUID(profileUuid);

            if (!configProfile) {
                return fail(ERRORS.CONFIG_PROFILE_NOT_FOUND);
            }

            const inbounds =
                await this.configProfileRepository.getInboundsWithSquadsByProfileUuid(profileUuid);

            return ok(new GetAllInboundsResponseModel(inbounds, inbounds.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_INBOUNDS_BY_PROFILE_UUID_ERROR);
        }
    }

    public async getAllInbounds(): Promise<TResult<GetAllInboundsResponseModel>> {
        try {
            const inbounds = await this.configProfileRepository.getAllInbounds();

            return ok(new GetAllInboundsResponseModel(inbounds, inbounds.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_INBOUNDS_ERROR);
        }
    }

    public async reorderConfigProfiles(
        dto: ReorderConfigProfilesRequestDto,
    ): Promise<TResult<GetConfigProfilesResponseModel>> {
        try {
            await this.configProfileRepository.reorderMany(dto.items);

            return await this.getConfigProfiles();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GENERIC_REORDER_ERROR);
        }
    }

    private async syncInbounds(
        existingInbounds: ConfigProfileInboundEntity[],
        newInbounds: ConfigProfileInboundEntity[],
    ): Promise<void> {
        try {
            const inboundsToRemove = existingInbounds.filter((existingInbound) => {
                const configInbound = newInbounds.find((ci) => ci.tag === existingInbound.tag);
                return !configInbound || configInbound.type !== existingInbound.type;
            });

            const inboundsToAdd = newInbounds.filter((configInbound) => {
                if (!existingInbounds) {
                    // TODO: need additional checks
                    return true;
                }
                const existingInbound = existingInbounds.find((ei) => ei.tag === configInbound.tag);
                return !existingInbound || existingInbound.type !== configInbound.type;
            });

            if (inboundsToRemove.length) {
                const tagsToRemove = inboundsToRemove.map((inbound) => inbound.tag);
                this.logger.log(`Removing inbounds: ${tagsToRemove.join(', ')}`);

                await this.configProfileRepository.deleteManyConfigProfileInboundsByUUIDs(
                    inboundsToRemove.map((inbound) => inbound.uuid),
                );
            }

            if (inboundsToAdd.length) {
                this.logger.log(`Adding inbounds: ${inboundsToAdd.map((i) => i.tag).join(', ')}`);
                await this.configProfileRepository.createManyConfigProfileInbounds(inboundsToAdd);
            }

            if (inboundsToAdd.length === 0 && inboundsToRemove.length === 0) {
                const inboundsToUpdate = newInbounds
                    .filter((configInbound) => {
                        if (!existingInbounds) {
                            return false;
                        }

                        const existingInbound = existingInbounds.find(
                            (ei) => ei.tag === configInbound.tag,
                        );

                        if (!existingInbound) {
                            return false;
                        }

                        const securityChanged = configInbound.security !== existingInbound.security;
                        const networkChanged = configInbound.network !== existingInbound.network;
                        const typeChanged = configInbound.type !== existingInbound.type;
                        const portChanged = configInbound.port !== existingInbound.port;
                        const rawInboundChanged = !_.isEqual(
                            configInbound.rawInbound,
                            existingInbound.rawInbound,
                        );

                        return (
                            securityChanged ||
                            networkChanged ||
                            typeChanged ||
                            portChanged ||
                            rawInboundChanged
                        );
                    })
                    .map((configInbound) => {
                        const existingInbound = existingInbounds.find(
                            (ei) => ei.tag === configInbound.tag,
                        );

                        if (!existingInbound) {
                            throw new Error(`Inbound with tag ${configInbound.tag} not found`);
                        }

                        existingInbound.security = configInbound.security;
                        existingInbound.network = configInbound.network;
                        existingInbound.type = configInbound.type;
                        existingInbound.port = configInbound.port;
                        existingInbound.rawInbound = configInbound.rawInbound;

                        return existingInbound;
                    });

                if (inboundsToUpdate.length) {
                    this.logger.log(
                        `Updating inbounds: ${inboundsToUpdate.map((i) => i.tag).join(', ')}`,
                    );

                    for (const inbound of inboundsToUpdate) {
                        await this.configProfileRepository.updateConfigProfileInbound(inbound);
                    }
                }
            }

            return;
        } catch (error) {
            this.logger.log('Inbounds synced/updated successfully');
            if (error instanceof Error) {
                this.logger.error('Failed to sync inbounds:', error.message);
            } else {
                this.logger.error('Failed to sync inbounds:', error);
            }
            throw error;
        }
    }
}
