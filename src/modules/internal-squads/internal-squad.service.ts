import { Transactional } from '@nestjs-cls/transactional';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { EventBus, QueryBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { getDateRangeArrayUtil } from '@common/utils/get-date-range-array.util';
import { ERRORS } from '@libs/contracts/constants/errors';

import { AddUsersToNodeEvent } from '@modules/nodes/events/add-users-to-node';
import { ValidateUserIdsQuery } from '@modules/users/queries/validate-user-ids';

import { NodesQueuesService } from '@queue/_nodes';
import { SquadsQueueService } from '@queue/_squads';

import {
    GetInternalSquadUsageQueryDto,
    GetInternalSquadUserUsageQueryDto,
    ReorderInternalSquadsBodyDto,
} from './dtos';
import { InternalSquadEntity } from './entities/internal-squad.entity';
import {
    GetInternalSquadAccessibleNodesResponseModel,
    GetInternalSquadUsageResponseModel,
    GetInternalSquadUserUsageResponseModel,
} from './models';
import { GetInternalSquadByUuidResponseModel } from './models/get-internal-squad-by-uuid.response.model';
import { GetInternalSquadsResponseModel } from './models/get-internal-squads.response.model';
import { InternalSquadRepository } from './repositories/internal-squad.repository';

@Injectable()
export class InternalSquadService {
    private readonly logger = new Logger(InternalSquadService.name);

    constructor(
        private readonly internalSquadRepository: InternalSquadRepository,
        private readonly nodesQueuesService: NodesQueuesService,
        private readonly squadsQueueService: SquadsQueueService,
        private readonly eventBus: EventBus,
        private readonly queryBus: QueryBus,
    ) {}

    public async getInternalSquads(): Promise<TResult<GetInternalSquadsResponseModel>> {
        try {
            const internalSquads = await this.internalSquadRepository.getInternalSquads();

            return ok(new GetInternalSquadsResponseModel(internalSquads, internalSquads.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_INTERNAL_SQUADS_ERROR);
        }
    }

    public async getInternalSquadByUuid(
        uuid: string,
    ): Promise<TResult<GetInternalSquadByUuidResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            return ok(new GetInternalSquadByUuidResponseModel(internalSquad));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_INTERNAL_SQUAD_BY_UUID_ERROR);
        }
    }

    public async createInternalSquad(
        name: string,
        inbounds: string[],
    ): Promise<TResult<GetInternalSquadByUuidResponseModel>> {
        try {
            if (name === 'Default-Squad') {
                return fail(ERRORS.RESERVED_INTERNAL_SQUAD_NAME);
            }

            const internalSquad = await this.internalSquadRepository.createWithInbounds(
                name,
                inbounds,
            );

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
                    return fail(ERRORS.INTERNAL_SQUAD_NAME_ALREADY_EXISTS);
                }
            }

            this.logger.error(error);
            return fail(ERRORS.CREATE_INTERNAL_SQUAD_ERROR);
        }
    }

    public async updateInternalSquad(
        uuid: string,
        name?: string,
        inbounds?: string[],
    ): Promise<TResult<GetInternalSquadByUuidResponseModel>> {
        try {
            const internalSquad = await this.internalSquadRepository.findByUUID(uuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            if (!name && !inbounds) {
                return fail(ERRORS.NAME_OR_INBOUNDS_REQUIRED);
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
                            this.nodesQueuesService.startAllNodesByProfile({
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
                    return fail(ERRORS.INTERNAL_SQUAD_NAME_ALREADY_EXISTS);
                }
            }

            this.logger.error(error);
            return fail(ERRORS.UPDATE_INTERNAL_SQUAD_ERROR);
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

    public async deleteInternalSquad(uuid: string): Promise<TResult<boolean>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            const includedProfiles = new Set<string>();

            for (const inbound of internalSquad.inbounds || []) {
                includedProfiles.add(inbound.profileUuid);
            }

            await this.internalSquadRepository.deleteByUUID(uuid);

            for (const profileUuid of includedProfiles) {
                await this.nodesQueuesService.startAllNodesByProfile({
                    profileUuid,
                    emitter: 'deleteInternalSquad',
                });
            }

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_INTERNAL_SQUAD_ERROR);
        }
    }

    public async addUsersToInternalSquad(uuid: string): Promise<TResult<boolean>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            await this.squadsQueueService.addUsersToInternalSquad({
                internalSquadUuid: uuid,
            });

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ADD_USERS_TO_INTERNAL_SQUAD_ERROR);
        }
    }

    public async removeUsersFromInternalSquad(uuid: string): Promise<TResult<boolean>> {
        try {
            const internalSquad = await this.internalSquadRepository.getInternalSquadsByUuid(uuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            await this.squadsQueueService.removeUsersFromInternalSquad({
                internalSquadUuid: uuid,
            });

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REMOVE_USERS_FROM_INTERNAL_SQUAD_ERROR);
        }
    }

    public async getInternalSquadAccessibleNodes(
        squadUuid: string,
    ): Promise<TResult<GetInternalSquadAccessibleNodesResponseModel>> {
        try {
            const internalSquad =
                await this.internalSquadRepository.getInternalSquadsByUuid(squadUuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            const result = await this.internalSquadRepository.getSquadAccessibleNodes(squadUuid);

            if (!result) {
                return ok(
                    new GetInternalSquadAccessibleNodesResponseModel({
                        squadUuid,
                        accessibleNodes: [],
                    }),
                );
            }

            return ok(new GetInternalSquadAccessibleNodesResponseModel(result));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_INTERNAL_SQUAD_ACCESSIBLE_NODES_ERROR);
        }
    }

    public async getSquadUsage(
        squadUuid: string,
        query: GetInternalSquadUsageQueryDto,
    ): Promise<TResult<GetInternalSquadUsageResponseModel>> {
        try {
            const { start, end, minTotalBytes, limit, cursor } = query;
            const internalSquad = await this.internalSquadRepository.findByUUID(squadUuid);

            if (!internalSquad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            const startDate = dayjs.utc(start).startOf('day').toDate();
            const endDate = dayjs.utc(end).endOf('day').toDate();

            const result = await this.internalSquadRepository.getSquadUsage({
                squadUuid,
                start: startDate,
                end: endDate,
                minTotalBytes,
                limit,
                cursor,
            });

            return ok(new GetInternalSquadUsageResponseModel({ squadUuid, ...result }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_INTERNAL_SQUAD_USAGE_ERROR);
        }
    }

    public async getSquadUserUsage(
        squadUuid: string,
        userId: number,
        query: GetInternalSquadUserUsageQueryDto,
    ): Promise<TResult<GetInternalSquadUserUsageResponseModel>> {
        try {
            const squad = await this.internalSquadRepository.findByUUID(squadUuid);

            if (!squad) {
                return fail(ERRORS.INTERNAL_SQUAD_NOT_FOUND);
            }

            const { startDate, endDate, dates } = getDateRangeArrayUtil(
                new Date(query.start),
                new Date(query.end),
            );

            const days = await this.internalSquadRepository.getUserSquadDailyUsage({
                squadUuid,
                userId: BigInt(userId),
                start: startDate,
                end: endDate,
                dates,
            });

            return ok(new GetInternalSquadUserUsageResponseModel({ days }));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_INTERNAL_SQUAD_USAGE_ERROR);
        }
    }

    public async reorderInternalSquads(
        dto: ReorderInternalSquadsBodyDto,
    ): Promise<TResult<GetInternalSquadsResponseModel>> {
        try {
            await this.internalSquadRepository.reorderMany(dto.items);

            return await this.getInternalSquads();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GENERIC_REORDER_ERROR);
        }
    }

    public async addManyUsersToInternalSquad(
        squadUuid: string,
        usersIds: number[],
    ): Promise<TResult<boolean>> {
        try {
            const validatedUsersIds = await this.queryBus.execute(
                new ValidateUserIdsQuery(usersIds),
            );
            if (!validatedUsersIds.isOk) {
                return fail(ERRORS.ADD_MANY_USERS_TO_INTERNAL_SQUAD_ERROR);
            }

            await this.internalSquadRepository.addManyUsersToInternalSquad(
                squadUuid,
                validatedUsersIds.response,
            );

            await this.eventBus.publish(new AddUsersToNodeEvent(validatedUsersIds.response));

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ADD_MANY_USERS_TO_INTERNAL_SQUAD_ERROR);
        }
    }

    public async removeManyUsersFromInternalSquad(
        squadUuid: string,
        usersIds: number[],
    ): Promise<TResult<boolean>> {
        try {
            const validatedUsersIds = await this.queryBus.execute(
                new ValidateUserIdsQuery(usersIds),
            );
            if (!validatedUsersIds.isOk) {
                return fail(ERRORS.REMOVE_MANY_USERS_FROM_INTERNAL_SQUAD_ERROR);
            }

            await this.internalSquadRepository.removeManyUsersFromInternalSquad(
                squadUuid,
                validatedUsersIds.response,
            );

            await this.eventBus.publish(new AddUsersToNodeEvent(validatedUsersIds.response));

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REMOVE_MANY_USERS_FROM_INTERNAL_SQUAD_ERROR);
        }
    }

    public async getTags(): Promise<TResult<string[]>> {
        try {
            const tags = await this.internalSquadRepository.findAllTags();

            return ok(tags);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ENTITY_TAGS_ERROR);
        }
    }

    public async setTags(uuid: string, tags: string[]): Promise<TResult<string[]>> {
        try {
            const updated = await this.internalSquadRepository.setTags(uuid, tags);

            return ok(updated);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.SET_ENTITY_TAGS_ERROR);
        }
    }
}
