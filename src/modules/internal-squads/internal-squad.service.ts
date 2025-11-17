import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants/errors';

import { StartAllNodesByProfileQueueService } from '@queue/start-all-nodes-by-profile';
import { InternalSquadActionsQueueService } from '@queue/internal-squad-actions';

import { GetInternalSquadByUuidResponseModel } from './models/get-internal-squad-by-uuid.response.model';
import { DeleteInternalSquadResponseModel } from './models/delete-internal-squad-by-uuid.response.model';
import { EventSentInternalSquadResponseModel } from './models/event-sent-internal-squad.response.model';
import { GetInternalSquadsResponseModel } from './models/get-internal-squads.response.model';
import { InternalSquadRepository } from './repositories/internal-squad.repository';
import { GetInternalSquadAccessibleNodesResponseModel } from './models';
import { InternalSquadEntity } from './entities/internal-squad.entity';
import { ReorderInternalSquadsRequestDto } from './dtos';

@Injectable()
export class InternalSquadService {
    private readonly logger = new Logger(InternalSquadService.name);

    constructor(
        private readonly internalSquadRepository: InternalSquadRepository,
        private readonly startAllNodesByProfileQueueService: StartAllNodesByProfileQueueService,
        private readonly internalSquadActionsQueueService: InternalSquadActionsQueueService,
    ) {}

    public async getInternalSquads(): Promise<ICommandResponse<GetInternalSquadsResponseModel>> {
        try {
            const internalSquads = await this.internalSquadRepository.getInternalSquads();

            return {
                isOk: true,
                response: new GetInternalSquadsResponseModel(internalSquads, internalSquads.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_INTERNAL_SQUADS_ERROR,
            };
        }
    }

    public async getInternalSquadByUuid(
        uuid: string,
    ): Promise<ICommandResponse<GetInternalSquadByUuidResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SQUAD_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: new GetInternalSquadByUuidResponseModel(internalSquad),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_INTERNAL_SQUAD_BY_UUID_ERROR,
            };
        }
    }

    @Transactional()
    public async createInternalSquad(
        name: string,
        inbounds: string[],
    ): Promise<ICommandResponse<GetInternalSquadByUuidResponseModel>> {
        try {
            if (name === 'Default-Squad') {
                return {
                    isOk: false,
                    ...ERRORS.RESERVED_INTERNAL_SQUAD_NAME,
                };
            }

            const internalSquad = await this.internalSquadRepository.create(
                new InternalSquadEntity({
                    name,
                }),
            );

            if (inbounds.length > 0) {
                await this.internalSquadRepository.createInbounds(inbounds, internalSquad.uuid);
            }

            return await this.getInternalSquadByUuid(internalSquad.uuid);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'InternalSquads' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.INTERNAL_SQUAD_NAME_ALREADY_EXISTS };
                }
            }

            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_INTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async updateInternalSquad(
        uuid: string,
        name?: string,
        inbounds?: string[],
    ): Promise<ICommandResponse<GetInternalSquadByUuidResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.findByUUID(uuid);

            if (!internalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SQUAD_NOT_FOUND,
                };
            }

            if (!name && !inbounds) {
                return {
                    isOk: false,
                    ...ERRORS.NAME_OR_INBOUNDS_REQUIRED,
                };
            }

            if (name) {
                await this.internalSquadRepository.update({
                    uuid,
                    name,
                });
            }

            if (inbounds !== undefined) {
                const currentInbounds = await this.internalSquadRepository.getInboundsBySquadUuid(
                    internalSquad.uuid,
                );

                const currentProfilesMap = new Map<string, Set<string>>();
                for (const inbound of currentInbounds) {
                    if (!currentProfilesMap.has(inbound.configProfileUuid)) {
                        currentProfilesMap.set(inbound.configProfileUuid, new Set());
                    }
                    currentProfilesMap.get(inbound.configProfileUuid)!.add(inbound.inboundUuid);
                }

                await this.syncInternalSquadInbounds(internalSquad, inbounds);

                const newInbounds = await this.internalSquadRepository.getInboundsBySquadUuid(
                    internalSquad.uuid,
                );

                const newProfilesMap = new Map<string, Set<string>>();
                for (const inbound of newInbounds) {
                    if (!newProfilesMap.has(inbound.configProfileUuid)) {
                        newProfilesMap.set(inbound.configProfileUuid, new Set());
                    }
                    newProfilesMap.get(inbound.configProfileUuid)!.add(inbound.inboundUuid);
                }

                const allProfileUuids = new Set([
                    ...currentProfilesMap.keys(),
                    ...newProfilesMap.keys(),
                ]);

                const affectedConfigProfiles: string[] = [];

                for (const profileUuid of allProfileUuids) {
                    const currentSet = currentProfilesMap.get(profileUuid) || new Set();
                    const newSet = newProfilesMap.get(profileUuid) || new Set();

                    if (currentSet.symmetricDifference(newSet).size > 0) {
                        affectedConfigProfiles.push(profileUuid);
                    }
                }

                if (affectedConfigProfiles.length > 0) {
                    this.logger.log(
                        `Internal squad changed, restart nodes for profiles: ${affectedConfigProfiles.join(
                            ', ',
                        )}`,
                    );

                    await Promise.all(
                        affectedConfigProfiles.map((profileUuid) =>
                            this.startAllNodesByProfileQueueService.startAllNodesByProfile({
                                profileUuid,
                                emitter: 'updateInternalSquad',
                            }),
                        ),
                    );
                }
            }

            return await this.getInternalSquadByUuid(internalSquad.uuid);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'InternalSquads' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.INTERNAL_SQUAD_NAME_ALREADY_EXISTS };
                }
            }

            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_INTERNAL_SQUAD_ERROR,
            };
        }
    }

    @Transactional()
    private async syncInternalSquadInbounds(
        internalSquad: InternalSquadEntity,
        inbounds: string[],
    ) {
        /* Clean & Add inbounds */
        await this.internalSquadRepository.cleanInbounds(internalSquad.uuid);

        if (inbounds.length > 0) {
            await this.internalSquadRepository.createInbounds(inbounds, internalSquad.uuid);
        }
        /* Clean & Add inbounds */
    }

    public async deleteInternalSquad(
        uuid: string,
    ): Promise<ICommandResponse<DeleteInternalSquadResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SQUAD_NOT_FOUND,
                };
            }

            const includedProfiles = new Set<string>();

            for (const inbound of internalSquad.inbounds || []) {
                includedProfiles.add(inbound.profileUuid);
            }

            const deleted = await this.internalSquadRepository.deleteByUUID(uuid);

            for (const profileUuid of includedProfiles) {
                await this.startAllNodesByProfileQueueService.startAllNodesByProfile({
                    profileUuid,
                    emitter: 'deleteInternalSquad',
                });
            }

            return {
                isOk: true,
                response: new DeleteInternalSquadResponseModel(deleted),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_INTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async addUsersToInternalSquad(
        uuid: string,
    ): Promise<ICommandResponse<EventSentInternalSquadResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SQUAD_NOT_FOUND,
                };
            }

            await this.internalSquadActionsQueueService.addUsersToInternalSquad({
                internalSquadUuid: uuid,
            });

            return {
                isOk: true,
                response: new EventSentInternalSquadResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ADD_USERS_TO_INTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async removeUsersFromInternalSquad(
        uuid: string,
    ): Promise<ICommandResponse<EventSentInternalSquadResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SQUAD_NOT_FOUND,
                };
            }

            await this.internalSquadActionsQueueService.removeUsersFromInternalSquad({
                internalSquadUuid: uuid,
            });

            return {
                isOk: true,
                response: new EventSentInternalSquadResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.REMOVE_USERS_FROM_INTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async getInternalSquadAccessibleNodes(
        squadUuid: string,
    ): Promise<ICommandResponse<GetInternalSquadAccessibleNodesResponseModel>> {
        try {
            const internalSquad =
                await this.internalSquadRepository.getInternalSquadsByUuid(squadUuid);

            if (!internalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.INTERNAL_SQUAD_NOT_FOUND,
                };
            }

            const result = await this.internalSquadRepository.getSquadAccessibleNodes(squadUuid);

            if (!result) {
                return {
                    isOk: true,
                    response: new GetInternalSquadAccessibleNodesResponseModel({
                        squadUuid,
                        accessibleNodes: [],
                    }),
                };
            }

            return {
                isOk: true,
                response: new GetInternalSquadAccessibleNodesResponseModel(result),
            };
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GET_INTERNAL_SQUAD_ACCESSIBLE_NODES_ERROR };
        }
    }

    public async reorderInternalSquads(
        dto: ReorderInternalSquadsRequestDto,
    ): Promise<ICommandResponse<GetInternalSquadsResponseModel>> {
        try {
            await this.internalSquadRepository.reorderMany(dto.items);

            return await this.getInternalSquads();
        } catch (error) {
            this.logger.error(error);
            return { isOk: false, ...ERRORS.GENERIC_REORDER_ERROR };
        }
    }
}
