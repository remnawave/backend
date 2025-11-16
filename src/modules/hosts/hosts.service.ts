import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { GetSubscriptionTemplateByUuidQuery } from '@modules/subscription-template/queries/get-template-by-uuid';
import { GetConfigProfileByUuidQuery } from '@modules/config-profiles/queries/get-config-profile-by-uuid';
import { ReorderHostRequestDto } from '@modules/hosts/dtos/reorder-hosts.dto';

import { DeleteHostResponseModel } from './models/delete-host.response.model';
import { HostsRepository } from './repositories/hosts.repository';
import { CreateHostRequestDto } from './dtos/create-host.dto';
import { HostsEntity } from './entities/hosts.entity';
import { UpdateHostRequestDto } from './dtos';

@Injectable()
export class HostsService {
    private readonly logger = new Logger(HostsService.name);
    constructor(
        private readonly hostsRepository: HostsRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async createHost(dto: CreateHostRequestDto): Promise<ICommandResponse<HostsEntity>> {
        try {
            if (dto.xrayJsonTemplateUuid) {
                const xrayJsonTemplate = await this.queryBus.execute(
                    new GetSubscriptionTemplateByUuidQuery(dto.xrayJsonTemplateUuid),
                );

                if (!xrayJsonTemplate.isOk || !xrayJsonTemplate.response) {
                    return {
                        isOk: false,
                        ...ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND,
                    };
                }

                if (xrayJsonTemplate.response.templateType !== 'XRAY_JSON') {
                    return {
                        isOk: false,
                        ...ERRORS.TEMPLATE_TYPE_NOT_ALLOWED,
                    };
                }
            }

            let xHttpExtraParams: null | object | undefined;
            if (dto.xHttpExtraParams !== undefined && dto.xHttpExtraParams !== null) {
                xHttpExtraParams = dto.xHttpExtraParams;
            } else if (dto.xHttpExtraParams === null) {
                xHttpExtraParams = null;
            } else {
                xHttpExtraParams = undefined;
            }

            let muxParams: null | object | undefined;
            if (dto.muxParams !== undefined && dto.muxParams !== null) {
                if (Object.keys(dto.muxParams).length === 0) {
                    muxParams = null;
                } else {
                    muxParams = dto.muxParams;
                }
            } else if (dto.muxParams === null) {
                muxParams = null;
            } else {
                muxParams = undefined;
            }

            let sockoptParams: null | object | undefined;
            if (dto.sockoptParams !== undefined && dto.sockoptParams !== null) {
                if (Object.keys(dto.sockoptParams).length === 0) {
                    sockoptParams = null;
                } else {
                    sockoptParams = dto.sockoptParams;
                }
            } else if (dto.sockoptParams === null) {
                sockoptParams = null;
            } else {
                sockoptParams = undefined;
            }

            let serverDescription: null | string | undefined;
            if (dto.serverDescription !== undefined && dto.serverDescription !== null) {
                serverDescription = dto.serverDescription;
            } else if (dto.serverDescription === null) {
                serverDescription = null;
            } else {
                serverDescription = undefined;
            }

            const { inbound: inboundObj, nodes, ...rest } = dto;

            const configProfile = await this.queryBus.execute(
                new GetConfigProfileByUuidQuery(inboundObj.configProfileUuid),
            );

            if (!configProfile.isOk || !configProfile.response) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            const configProfileInbound = configProfile.response.inbounds.find(
                (inbound) => inbound.uuid === inboundObj.configProfileInboundUuid,
            );

            if (!configProfileInbound) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE,
                };
            }

            const hostEntity = new HostsEntity({
                ...rest,
                address: dto.address.trim(),
                xHttpExtraParams,
                muxParams,
                sockoptParams,
                configProfileUuid: configProfile.response.uuid,
                configProfileInboundUuid: configProfileInbound.uuid,
                serverDescription,
            });

            const result = await this.hostsRepository.create(hostEntity);

            if (nodes !== undefined && nodes.length > 0) {
                await this.hostsRepository.addNodesToHost(result.uuid, nodes);
                result.nodes = nodes.map((node) => {
                    return {
                        nodeUuid: node,
                    };
                });
            }

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);

            return { isOk: false, ...ERRORS.CREATE_HOST_ERROR };
        }
    }

    public async updateHost(dto: UpdateHostRequestDto): Promise<ICommandResponse<HostsEntity>> {
        try {
            const { inbound: inboundObj, nodes, ...rest } = dto;

            const host = await this.hostsRepository.findByUUID(dto.uuid);
            if (!host) {
                return {
                    isOk: false,
                    ...ERRORS.HOST_NOT_FOUND,
                };
            }

            if (dto.xrayJsonTemplateUuid) {
                const xrayJsonTemplate = await this.queryBus.execute(
                    new GetSubscriptionTemplateByUuidQuery(dto.xrayJsonTemplateUuid),
                );

                if (!xrayJsonTemplate.isOk || !xrayJsonTemplate.response) {
                    return {
                        isOk: false,
                        ...ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND,
                    };
                }

                if (xrayJsonTemplate.response.templateType !== 'XRAY_JSON') {
                    return {
                        isOk: false,
                        ...ERRORS.TEMPLATE_TYPE_NOT_ALLOWED,
                    };
                }
            }

            let xHttpExtraParams: null | object | undefined;
            if (dto.xHttpExtraParams !== undefined && dto.xHttpExtraParams !== null) {
                xHttpExtraParams = dto.xHttpExtraParams;
            } else if (dto.xHttpExtraParams === null) {
                xHttpExtraParams = null;
            } else {
                xHttpExtraParams = undefined;
            }

            let muxParams: null | object | undefined;
            if (dto.muxParams !== undefined && dto.muxParams !== null) {
                if (Object.keys(dto.muxParams).length === 0) {
                    muxParams = null;
                } else {
                    muxParams = dto.muxParams;
                }
            } else if (dto.muxParams === null) {
                muxParams = null;
            } else {
                muxParams = undefined;
            }

            let sockoptParams: null | object | undefined;
            if (dto.sockoptParams !== undefined && dto.sockoptParams !== null) {
                if (Object.keys(dto.sockoptParams).length === 0) {
                    sockoptParams = null;
                } else {
                    sockoptParams = dto.sockoptParams;
                }
            } else if (dto.sockoptParams === null) {
                sockoptParams = null;
            } else {
                sockoptParams = undefined;
            }

            let serverDescription: null | string | undefined;
            if (dto.serverDescription !== undefined && dto.serverDescription !== null) {
                serverDescription = dto.serverDescription;
            } else if (dto.serverDescription === null) {
                serverDescription = null;
            } else {
                serverDescription = undefined;
            }

            let configProfileUuid: string | undefined;
            let configProfileInboundUuid: string | undefined;
            if (inboundObj) {
                const configProfile = await this.queryBus.execute(
                    new GetConfigProfileByUuidQuery(inboundObj.configProfileUuid),
                );

                if (!configProfile.isOk || !configProfile.response) {
                    return {
                        isOk: false,
                        ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                    };
                }

                const configProfileInbound = configProfile.response.inbounds.find(
                    (inbound) => inbound.uuid === inboundObj.configProfileInboundUuid,
                );

                if (!configProfileInbound) {
                    return {
                        isOk: false,
                        ...ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE,
                    };
                }

                configProfileUuid = configProfile.response.uuid;
                configProfileInboundUuid = configProfileInbound.uuid;
            }

            if (nodes !== undefined) {
                await this.hostsRepository.clearNodesFromHost(host.uuid);
                await this.hostsRepository.addNodesToHost(host.uuid, nodes);
            }

            const result = await this.hostsRepository.update({
                ...rest,
                address: dto.address ? dto.address.trim() : undefined,
                xHttpExtraParams,
                muxParams,
                sockoptParams,
                configProfileUuid,
                configProfileInboundUuid,
                serverDescription,
            });

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);

            return { isOk: false, ...ERRORS.UPDATE_HOST_ERROR };
        }
    }

    public async deleteHost(hostUuid: string): Promise<ICommandResponse<DeleteHostResponseModel>> {
        try {
            const host = await this.hostsRepository.findByUUID(hostUuid);
            if (!host) {
                return {
                    isOk: false,
                    ...ERRORS.HOST_NOT_FOUND,
                };
            }
            const result = await this.hostsRepository.deleteByUUID(host.uuid);

            return {
                isOk: true,
                response: new DeleteHostResponseModel({
                    isDeleted: result,
                }),
            };
        } catch (error) {
            this.logger.error(error);
            this.logger.error(JSON.stringify(error));
            return { isOk: false, ...ERRORS.DELETE_HOST_ERROR };
        }
    }

    public async getAllHosts(): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            const result = await this.hostsRepository.findAll();

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            return { isOk: false, ...ERRORS.GET_ALL_HOSTS_ERROR };
        }
    }

    public async getOneHost(hostUuid: string): Promise<ICommandResponse<HostsEntity>> {
        try {
            const result = await this.hostsRepository.findByUUID(hostUuid);

            if (!result) {
                return {
                    isOk: false,
                    ...ERRORS.HOST_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_ONE_HOST_ERROR };
        }
    }

    public async reorderHosts(dto: ReorderHostRequestDto): Promise<
        ICommandResponse<{
            isUpdated: boolean;
        }>
    > {
        try {
            const result = await this.hostsRepository.reorderMany(dto.hosts);

            return {
                isOk: true,
                response: {
                    isUpdated: result,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.REORDER_HOSTS_ERROR };
        }
    }

    public async deleteHosts(uuids: string[]): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            await this.hostsRepository.deleteMany(uuids);

            const result = await this.getAllHosts();

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.DELETE_HOSTS_ERROR };
        }
    }

    public async bulkEnableHosts(uuids: string[]): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            await this.hostsRepository.enableMany(uuids);

            const result = await this.getAllHosts();

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.BULK_ENABLE_HOSTS_ERROR };
        }
    }

    public async bulkDisableHosts(uuids: string[]): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            await this.hostsRepository.disableMany(uuids);

            const result = await this.getAllHosts();

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.BULK_DISABLE_HOSTS_ERROR };
        }
    }

    public async setInboundToHosts(
        uuids: string[],
        configProfileUuid: string,
        configProfileInboundUuid: string,
    ): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            const configProfile = await this.queryBus.execute(
                new GetConfigProfileByUuidQuery(configProfileUuid),
            );

            if (!configProfile.isOk || !configProfile.response) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_NOT_FOUND,
                };
            }

            const configProfileInbound = configProfile.response.inbounds.find(
                (inbound) => inbound.uuid === configProfileInboundUuid,
            );

            if (!configProfileInbound) {
                return {
                    isOk: false,
                    ...ERRORS.CONFIG_PROFILE_INBOUND_NOT_FOUND_IN_SPECIFIED_PROFILE,
                };
            }

            await this.hostsRepository.setInboundToManyHosts(
                uuids,
                configProfileUuid,
                configProfileInboundUuid,
            );

            const result = await this.getAllHosts();

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.SET_INBOUND_TO_HOSTS_ERROR };
        }
    }

    public async setPortToHosts(
        uuids: string[],
        port: number,
    ): Promise<ICommandResponse<HostsEntity[]>> {
        try {
            await this.hostsRepository.setPortToManyHosts(uuids, port);

            const result = await this.getAllHosts();

            return {
                isOk: true,
                response: result.response,
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.SET_PORT_TO_HOSTS_ERROR };
        }
    }

    public async getAllHostTags(): Promise<ICommandResponse<string[]>> {
        try {
            const result = await this.hostsRepository.getAllHostTags();

            return { isOk: true, response: result };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_ALL_HOST_TAGS_ERROR };
        }
    }
}
