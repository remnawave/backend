import { Transactional } from '@nestjs-cls/transactional';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Injectable, Logger } from '@nestjs/common';

import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, TSubscriptionTemplateType } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';
import { ResolvedProxyConfigSchema } from '@libs/contracts/models';

import { SquadsQueueService } from '@queue/_squads';

import { ReorderExternalSquadsBodyDto, UpdateExternalSquadBodyDto } from './dtos';
import { ExternalSquadEntity } from './entities';
import { GetExternalSquadByUuidResponseModel } from './models/get-external-squad-by-uuid.response.model';
import { GetExternalSquadsResponseModel } from './models/get-external-squads.response.model';
import { ExternalSquadRepository } from './repositories/external-squad.repository';

@Injectable()
export class ExternalSquadService {
    private readonly logger = new Logger(ExternalSquadService.name);

    constructor(
        private readonly externalSquadRepository: ExternalSquadRepository,
        private readonly squadsQueueService: SquadsQueueService,
        private readonly rawCacheService: RawCacheService,
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
        dto: UpdateExternalSquadBodyDto,
    ): Promise<TResult<GetExternalSquadByUuidResponseModel>> {
        const {
            uuid,
            name,
            templates,
            subscriptionSettings,
            hostOverrides,
            responseHeadersAdd,
            responseHeadersRemove,
            hwidSettings,
            customRemarks,
            subpageConfigUuid,
        } = dto;

        try {
            const externalSquad = await this.externalSquadRepository.getExternalSquadByUuid(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            if (dto.customRemarks) {
                for (const [status, remarks] of Object.entries(dto.customRemarks)) {
                    for (const remark of remarks) {
                        if (remark.trim().startsWith('{')) {
                            try {
                                ResolvedProxyConfigSchema.parse(JSON.parse(remark));
                            } catch (error) {
                                return fail(
                                    ERRORS.CUSTOM_RAW_REMARK_VALIDATION_ERROR.withMessage(
                                        `${status}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                    ),
                                );
                            }
                        }
                    }
                }
            }

            await this.externalSquadRepository.update({
                uuid,
                name: name,
                subscriptionSettings: subscriptionSettings,
                hostOverrides: hostOverrides,
                responseHeadersAdd: responseHeadersAdd
                    ? Object.fromEntries(
                          Object.entries(responseHeadersAdd).map(([key, value]) => [
                              key.toLowerCase(),
                              value,
                          ]),
                      )
                    : responseHeadersAdd,

                responseHeadersRemove: responseHeadersRemove
                    ? responseHeadersRemove.map((header) => header.toLowerCase())
                    : responseHeadersRemove,
                hwidSettings: hwidSettings,
                customRemarks: customRemarks,
                subpageConfigUuid: subpageConfigUuid,
            });

            for (const template of externalSquad.templates) {
                await this.rawCacheService.del(
                    CACHE_KEYS.EXTERNAL_SQUAD_TEMPLATE_NAME(
                        externalSquad.uuid,
                        template.templateType,
                    ),
                );
            }

            if (templates !== undefined) {
                await this.syncExternalSquadTemplates(externalSquad, templates);
            }

            await this.rawCacheService.del(CACHE_KEYS.EXTERNAL_SQUAD_SETTINGS(externalSquad.uuid));

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

    public async deleteExternalSquad(uuid: string): Promise<TResult<boolean>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            await this.rawCacheService.del(CACHE_KEYS.EXTERNAL_SQUAD_SETTINGS(externalSquad.uuid));

            await this.externalSquadRepository.deleteByUUID(uuid);

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async addUsersToExternalSquad(uuid: string): Promise<TResult<boolean>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            await this.squadsQueueService.addUsersToExternalSquad({
                externalSquadUuid: uuid,
            });

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.ADD_USERS_TO_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async removeUsersFromExternalSquad(uuid: string): Promise<TResult<boolean>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return fail(ERRORS.EXTERNAL_SQUAD_NOT_FOUND);
            }

            await this.squadsQueueService.removeUsersFromExternalSquad({
                externalSquadUuid: uuid,
            });

            return ok(true);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REMOVE_USERS_FROM_EXTERNAL_SQUAD_ERROR);
        }
    }

    public async reorderExternalSquads(
        dto: ReorderExternalSquadsBodyDto,
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
