import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { RemoveIntegrationFromNodesCommand } from '@modules/nodes/commands/remove-integration-from-nodes';
import { GetProfileUuidsByIntegrationUuidQuery } from '@modules/nodes/queries/get-profile-uuids-by-integration-uuid';

import { NodesQueuesService } from '@queue/_nodes';

import { NodeIntegrationEntity } from './entities/node-integration.entity';
import { BaseNodeIntegrationResponseModel, GetNodeIntegrationsResponseModel } from './models';
import { NodeIntegrationRepository } from './repositories/node-integrations.repository';

@Injectable()
export class NodeIntegrationService {
    private readonly logger = new Logger(NodeIntegrationService.name);

    constructor(
        private readonly nodeIntegrationRepository: NodeIntegrationRepository,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    public async getAllIntegrations(): Promise<TResult<GetNodeIntegrationsResponseModel>> {
        try {
            const integrations = await this.nodeIntegrationRepository.getAllIntegrations();

            return ok(new GetNodeIntegrationsResponseModel(integrations, integrations.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_NODE_INTEGRATIONS_ERROR);
        }
    }

    public async getIntegrationByUuid(
        uuid: string,
    ): Promise<TResult<BaseNodeIntegrationResponseModel>> {
        try {
            const integration = await this.nodeIntegrationRepository.findByUUID(uuid);

            if (!integration) {
                return fail(ERRORS.NODE_INTEGRATION_NOT_FOUND);
            }

            return ok(new BaseNodeIntegrationResponseModel(integration));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_NODE_INTEGRATION_BY_UUID_ERROR);
        }
    }

    public async createIntegration(
        name: string,
        description: string | null | undefined,
        config: Record<string, unknown>,
    ): Promise<TResult<BaseNodeIntegrationResponseModel>> {
        try {
            const integration = await this.nodeIntegrationRepository.create(
                new NodeIntegrationEntity({
                    name,
                    description: description ?? null,
                    config,
                }),
            );

            return ok(new BaseNodeIntegrationResponseModel(integration));
        } catch (error) {
            this.logger.error(error);

            if (this.isNameConflict(error)) {
                return fail(ERRORS.NODE_INTEGRATION_NAME_ALREADY_EXISTS);
            }

            return fail(ERRORS.CREATE_NODE_INTEGRATION_ERROR);
        }
    }

    public async updateIntegration(
        uuid: string,
        name: string | undefined,
        description: string | null | undefined,
        config: Record<string, unknown> | undefined,
        restartNodes: boolean,
    ): Promise<TResult<BaseNodeIntegrationResponseModel>> {
        try {
            const integration = await this.nodeIntegrationRepository.findByUUID(uuid);

            if (!integration) {
                return fail(ERRORS.NODE_INTEGRATION_NOT_FOUND);
            }

            const updatedIntegration = await this.nodeIntegrationRepository.update({
                uuid: integration.uuid,
                name,
                description,
                config,
            });

            if (restartNodes) {
                const profileUuidsResult = await this.queryBus.execute(
                    new GetProfileUuidsByIntegrationUuidQuery(integration.uuid),
                );

                if (profileUuidsResult.isOk) {
                    await this.restartProfiles(
                        profileUuidsResult.response,
                        'updateNodeIntegration',
                    );
                }
            }

            return ok(new BaseNodeIntegrationResponseModel(updatedIntegration));
        } catch (error) {
            this.logger.error(error);

            if (this.isNameConflict(error)) {
                return fail(ERRORS.NODE_INTEGRATION_NAME_ALREADY_EXISTS);
            }

            return fail(ERRORS.UPDATE_NODE_INTEGRATION_ERROR);
        }
    }

    public async deleteIntegration(uuid: string): Promise<TResult<boolean>> {
        try {
            const integration = await this.nodeIntegrationRepository.findByUUID(uuid);

            if (!integration) {
                return fail(ERRORS.NODE_INTEGRATION_NOT_FOUND);
            }

            const profileUuidsResult = await this.queryBus.execute(
                new GetProfileUuidsByIntegrationUuidQuery(integration.uuid),
            );

            await this.commandBus.execute(new RemoveIntegrationFromNodesCommand(integration.uuid));

            await this.nodeIntegrationRepository.deleteByUUID(integration.uuid);

            if (profileUuidsResult.isOk) {
                await this.restartProfiles(profileUuidsResult.response, 'deleteNodeIntegration');
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_NODE_INTEGRATION_ERROR);
        }
    }

    private async restartProfiles(profileUuids: string[], emitter: string): Promise<void> {
        for (const profileUuid of profileUuids) {
            await this.nodesQueuesService.startAllNodesByProfile({
                profileUuid,
                emitter,
                force: true,
            });
        }
    }

    private isNameConflict(error: unknown): boolean {
        if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2002' &&
            error.meta?.modelName === 'Integrations' &&
            Array.isArray(error.meta.target)
        ) {
            return (error.meta.target as string[]).includes('name');
        }

        return false;
    }
}
