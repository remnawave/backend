import type { Cache } from 'cache-manager';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, TSubscriptionTemplateType } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

import { SquadsQueueService } from '@queue/_squads';

import {
    DeleteExternalSquadByUuidResponseModel,
    EventSentExternalSquadResponseModel,
} from './models';
import { GetExternalSquadByUuidResponseModel } from './models/get-external-squad-by-uuid.response.model';
import { GetExternalSquadsResponseModel } from './models/get-external-squads.response.model';
import { ReorderExternalSquadsRequestDto, UpdateExternalSquadRequestDto } from './dtos';
import { ExternalSquadRepository } from './repositories/external-squad.repository';
import { ExternalSquadEntity } from './entities';

@Injectable()
export class ExternalSquadService {
    private readonly logger = new Logger(ExternalSquadService.name);

    constructor(
        private readonly externalSquadRepository: ExternalSquadRepository,
        private readonly squadsQueueService: SquadsQueueService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    public async getExternalSquads(): Promise<TResult<GetExternalSquadsResponseModel>> {
        try {
            const externalSquads = await this.externalSquadRepository.getExternalSquads();

            return ok(new GetExternalSquadsResponseModel(externalSquads, externalSquads.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_EXTERNAL_SQUADS_ERROR);
        }
    }

    public async getExternalSquadByUuid(
        uuid: string,
    ): Promise<TResult<GetExternalSquadByUuidResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.getExternalSquadByUuid(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            return ok(new GetExternalSquadByUuidResponseModel(externalSquad));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_EXTERNAL_SQUAD_BY_UUID_ERROR);
        }
    }

    public async createExternalSquad(
        name: string,
    ): Promise<TResult<GetExternalSquadByUuidResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.create(
                new ExternalSquadEntity({
                    name,
                }),
            );

            return await this.getExternalSquadByUuid(externalSquad.uuid);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'ExternalSquads' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.EXTERNAL_SQUAD_NAME_ALREADY_EXISTS);
                }
            }

            this.logger.error(error);
            return fail(ERRORS.CREATE_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async updateExternalSquad(
        dto: UpdateExternalSquadRequestDto,
    ): Promise<TResult<GetExternalSquadByUuidResponseModel>> {
        const {
            uuid,
            name,
            templates,
            subscriptionSettings,
            hostOverrides,
            responseHeaders,
            hwidSettings,
            customRemarks,
            subpageConfigUuid,
        } = dto;

        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            if (
                !name &&
                !templates &&
                !subscriptionSettings &&
                !hostOverrides &&
                !responseHeaders &&
                hwidSettings === undefined &&
                customRemarks === undefined &&
                subpageConfigUuid === undefined
            ) {
                return fail(ERRORS.NAME_OR_TEMPLATES_REQUIRED);
            }

            await this.externalSquadRepository.update({
                uuid,
                name: name || undefined,
                subscriptionSettings: subscriptionSettings || undefined,
                hostOverrides: hostOverrides || undefined,
                responseHeaders: responseHeaders || undefined,
                hwidSettings: hwidSettings,
                customRemarks: customRemarks,
                subpageConfigUuid: subpageConfigUuid,
            });

            if (templates !== undefined) {
                await this.syncExternalSquadTemplates(externalSquad, templates);
            }

            await this.cacheManager.del(CACHE_KEYS.EXTERNAL_SQUAD_SETTINGS(externalSquad.uuid));

            return await this.getExternalSquadByUuid(externalSquad.uuid);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'ExternalSquads' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.EXTERNAL_SQUAD_NAME_ALREADY_EXISTS);
                }
            }

            this.logger.error(error);
            return fail(ERRORS.UPDATE_EXTERNAL_SQUAD_ERROR);
        }
    }

    @Transactional()
    private async syncExternalSquadTemplates(
        externalSquad: ExternalSquadEntity,
        templates: {
            templateType: TSubscriptionTemplateType;
            templateUuid: string;
        }[],
    ) {
        /* Clean & Add templates */
        await this.externalSquadRepository.cleanTemplates(externalSquad.uuid);

        if (templates.length > 0) {
            await this.externalSquadRepository.createTemplates(
                templates.map((template) => ({
                    templateType: template.templateType,
                    templateUuid: template.templateUuid,
                })),
                externalSquad.uuid,
            );
        }
        /* Clean & Add templates */
    }

    public async deleteExternalSquad(
        uuid: string,
    ): Promise<TResult<DeleteExternalSquadByUuidResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            await this.cacheManager.del(CACHE_KEYS.EXTERNAL_SQUAD_SETTINGS(externalSquad.uuid));

            const deleted = await this.externalSquadRepository.deleteByUUID(uuid);

            return ok(new DeleteExternalSquadByUuidResponseModel(deleted));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async addUsersToExternalSquad(
        uuid: string,
    ): Promise<TResult<EventSentExternalSquadResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            await this.squadsQueueService.addUsersToExternalSquad({
                externalSquadUuid: uuid,
            });

            return ok(new EventSentExternalSquadResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ADD_USERS_TO_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async removeUsersFromExternalSquad(
        uuid: string,
    ): Promise<TResult<EventSentExternalSquadResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            await this.squadsQueueService.removeUsersFromExternalSquad({
                externalSquadUuid: uuid,
            });

            return ok(new EventSentExternalSquadResponseModel(true));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REMOVE_USERS_FROM_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async reorderExternalSquads(
        dto: ReorderExternalSquadsRequestDto,
    ): Promise<TResult<GetExternalSquadsResponseModel>> {
        try {
            await this.externalSquadRepository.reorderMany(dto.items);

            return await this.getExternalSquads();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GENERIC_REORDER_ERROR);
        }
    }
}
