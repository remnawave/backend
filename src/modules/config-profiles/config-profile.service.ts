import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import _ from 'lodash';

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { XRayConfig } from '@common/helpers/xray-config';
import { ERRORS } from '@libs/contracts/constants/errors';

import { StartAllNodesByProfileQueueService } from '@queue/start-all-nodes-by-profile';
import { StopNodeQueueService } from '@queue/stop-node';

import { GetConfigProfileByUuidResponseModel } from './models/get-config-profile-by-uuid.response.model';
import { DeleteConfigProfileByUuidResponseModel, GetAllInboundsResponseModel } from './models';
import { GetConfigProfilesResponseModel } from './models/get-config-profiles.response.model';
import { ConfigProfileInboundEntity } from './entities/config-profile-inbound.entity';
import { ConfigProfileRepository } from './repositories/config-profile.repository';
import { ConfigProfileEntity } from './entities/config-profile.entity';

@Injectable()
export class ConfigProfileService {
    private readonly logger = new Logger(ConfigProfileService.name);

    constructor(
        private readonly configProfileRepository: ConfigProfileRepository,
        private readonly startAllNodesByProfileQueueService: StartAllNodesByProfileQueueService,
        private readonly stopNodeQueueService: StopNodeQueueService,
    ) {}

    public async getConfigProfiles(): Promise<ICommandResponse<GetConfigProfilesResponseModel>> {
        try {
            const configProfiles = await this.configProfileRepository.getAllConfigProfiles();

            for (const configProfile of configProfiles) {
                configProfile.config = new XRayConfig(
                    configProfile.config as object,
                ).getSortedConfig();
            }

            const total = await this.configProfileRepository.getTotalConfigProfiles();

            return {
                isOk: true,
                response: new GetConfigProfilesResponseModel(configProfiles, total),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_CONFIG_PROFILES_ERROR,
            };
        }
    }

    public async getConfigProfileByUUID(
        uuid: string,
    ): Promise<ICommandResponse<GetConfigProfileByUuidResponseModel>> {
        try {
            const configProfile = await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!configProfile) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            configProfile.config = new XRayConfig(configProfile.config as object).getSortedConfig();

            return {
                isOk: true,
                response: new GetConfigProfileByUuidResponseModel(configProfile),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_CONFIG_PROFILE_BY_UUID_ERROR,
            };
        }
    }

    public async deleteConfigProfileByUUID(
        uuid: string,
    ): Promise<ICommandResponse<DeleteConfigProfileByUuidResponseModel>> {
        try {
            const configProfile = await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!configProfile) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            for (const node of configProfile.nodes) {
                await this.stopNodeQueueService.stopNode({
                    nodeUuid: node.uuid,
                    isNeedToBeDeleted: false,
                });
            }

            const result = await this.configProfileRepository.deleteByUUID(uuid);

            return {
                isOk: true,
                response: new DeleteConfigProfileByUuidResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_CONFIG_PROFILE_BY_UUID_ERROR,
            };
        }
    }

    @Transactional()
    public async createConfigProfile(
        name: string,
        config: object,
    ): Promise<ICommandResponse<GetConfigProfileByUuidResponseModel>> {
        try {
            if (name === 'Default-Profile') {
                return {
                    isOk: false,
                    ...ERRORS.RESERVED_CONFIG_PROFILE_NAME,
                };
            }

            const validatedConfig = new XRayConfig(config);
            const sortedConfig = validatedConfig.getSortedConfig();

            const profileEntity = new ConfigProfileEntity({
                name,
                config: sortedConfig as object,
            });

            const inbounds = validatedConfig.getAllInbounds();

            const configProfile = await this.configProfileRepository.create(profileEntity);

            const inboundsEntities = inbounds.map(
                (inbound) =>
                    new ConfigProfileInboundEntity({
                        profileUuid: configProfile.uuid,
                        tag: inbound.tag,
                        type: inbound.type,
                        network: inbound.network,
                        security: inbound.security,
                        port: inbound.port,
                        rawInbound: inbound.rawInbound as unknown as object,
                    }),
            );

            if (inboundsEntities.length) {
                await this.configProfileRepository.createManyConfigProfileInbounds(
                    inboundsEntities,
                );
            }

            return this.getConfigProfileByUUID(configProfile.uuid);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                (error.meta?.modelName === 'ConfigProfileInbounds' ||
                    error.meta?.modelName === 'ConfigProfiles') &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('tag')) {
                    return { isOk: false, ...ERRORS.INBOUNDS_WITH_SAME_TAG_ALREADY_EXISTS };
                }
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.CONFIG_PROFILE_NAME_ALREADY_EXISTS };
                }
            }
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_CONFIG_PROFILE_ERROR,
            };
        }
    }

    @Transactional()
    public async updateConfigProfile(
        uuid: string,
        name?: string,
        config?: object,
    ): Promise<ICommandResponse<GetConfigProfileByUuidResponseModel>> {
        try {
            const existingConfigProfile =
                await this.configProfileRepository.getConfigProfileByUUID(uuid);

            if (!existingConfigProfile) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            if (!name && !config) {
                return {
                    isOk: false,
                    ...ERRORS.NAME_OR_CONFIG_REQUIRED,
                };
            }

            const configProfileEntity = new ConfigProfileEntity({
                uuid,
            });

            if (name) {
                configProfileEntity.name = name;
            }

            if (config) {
                const existingInbounds = existingConfigProfile.inbounds;

                const validatedConfig = new XRayConfig(config);
                validatedConfig.cleanClients();
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

            if (config) {
                // No need for now
                // await this.commandBus.execute(new SyncActiveProfileCommand());

                await this.startAllNodesByProfileQueueService.startAllNodesByProfile({
                    profileUuid: existingConfigProfile.uuid,
                    emitter: 'updateConfigProfile',
                });
            }

            return this.getConfigProfileByUUID(existingConfigProfile.uuid);
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                (error.meta?.modelName === 'ConfigProfileInbounds' ||
                    error.meta?.modelName === 'ConfigProfiles') &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('tag')) {
                    return { isOk: false, ...ERRORS.INBOUNDS_WITH_SAME_TAG_ALREADY_EXISTS };
                }
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.CONFIG_PROFILE_NAME_ALREADY_EXISTS };
                }
            }

            if (error instanceof Error) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_VALIDATION_ERROR.withMessage(error.message),
                };
            }

            return {
                isOk: false,
                ...ERRORS.UPDATE_CONFIG_PROFILE_ERROR,
            };
        }
    }

    public async getInboundsByProfileUuid(
        profileUuid: string,
    ): Promise<ICommandResponse<GetAllInboundsResponseModel>> {
        try {
            const configProfile =
                await this.configProfileRepository.getConfigProfileByUUID(profileUuid);

            if (!configProfile) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            const inbounds =
                await this.configProfileRepository.getInboundsWithSquadsByProfileUuid(profileUuid);

            return {
                isOk: true,
                response: new GetAllInboundsResponseModel(inbounds, inbounds.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_INBOUNDS_BY_PROFILE_UUID_ERROR,
            };
        }
    }

    public async getAllInbounds(): Promise<ICommandResponse<GetAllInboundsResponseModel>> {
        try {
            const inbounds = await this.configProfileRepository.getAllInbounds();

            return {
                isOk: true,
                response: new GetAllInboundsResponseModel(inbounds, inbounds.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_ALL_INBOUNDS_ERROR,
            };
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
