import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { TSubscriptionTemplateType } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

import { ExternalSquadActionsQueueService } from '@queue/external-squad-actions';

import {
    DeleteExternalSquadByUuidResponseModel,
    EventSentExternalSquadResponseModel,
} from './models';
import { GetExternalSquadByUuidResponseModel } from './models/get-external-squad-by-uuid.response.model';
import { GetExternalSquadsResponseModel } from './models/get-external-squads.response.model';
import { ExternalSquadRepository } from './repositories/external-squad.repository';
import { UpdateExternalSquadRequestDto } from './dtos';
import { ExternalSquadEntity } from './entities';

@Injectable()
export class ExternalSquadService {
    private readonly logger = new Logger(ExternalSquadService.name);

    constructor(
        private readonly externalSquadRepository: ExternalSquadRepository,
        private readonly externalSquadActionsQueueService: ExternalSquadActionsQueueService,
    ) {}

    public async getExternalSquads(): Promise<ICommandResponse<GetExternalSquadsResponseModel>> {
        try {
            const externalSquads = await this.externalSquadRepository.getExternalSquads();

            return {
                isOk: true,
                response: new GetExternalSquadsResponseModel(externalSquads, externalSquads.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_EXTERNAL_SQUADS_ERROR,
            };
        }
    }

    public async getExternalSquadByUuid(
        uuid: string,
    ): Promise<ICommandResponse<GetExternalSquadByUuidResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.getExternalSquadByUuid(uuid);

            if (!externalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.EXTERNAL_SQUAD_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: new GetExternalSquadByUuidResponseModel(externalSquad),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_EXTERNAL_SQUAD_BY_UUID_ERROR,
            };
        }
    }

    @Transactional()
    public async createExternalSquad(
        name: string,
    ): Promise<ICommandResponse<GetExternalSquadByUuidResponseModel>> {
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
                    return { isOk: false, ...ERRORS.EXTERNAL_SQUAD_NAME_ALREADY_EXISTS };
                }
            }

            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_EXTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async updateExternalSquad(
        dto: UpdateExternalSquadRequestDto,
    ): Promise<ICommandResponse<GetExternalSquadByUuidResponseModel>> {
        const { uuid, name, templates, subscriptionSettings } = dto;

        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.EXTERNAL_SQUAD_NOT_FOUND,
                };
            }

            if (!name && !templates && !subscriptionSettings) {
                return {
                    isOk: false,
                    ...ERRORS.NAME_OR_TEMPLATES_REQUIRED,
                };
            }

            if (name || subscriptionSettings) {
                await this.externalSquadRepository.update({
                    uuid,
                    name: name || undefined,
                    subscriptionSettings: subscriptionSettings || undefined,
                });
            }

            if (templates !== undefined) {
                await this.syncExternalSquadTemplates(externalSquad, templates);
            }

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
                    return { isOk: false, ...ERRORS.EXTERNAL_SQUAD_NAME_ALREADY_EXISTS };
                }
            }

            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_EXTERNAL_SQUAD_ERROR,
            };
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
    ): Promise<ICommandResponse<DeleteExternalSquadByUuidResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.EXTERNAL_SQUAD_NOT_FOUND,
                };
            }

            const deleted = await this.externalSquadRepository.deleteByUUID(uuid);

            return {
                isOk: true,
                response: new DeleteExternalSquadByUuidResponseModel(deleted),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_EXTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async addUsersToExternalSquad(
        uuid: string,
    ): Promise<ICommandResponse<EventSentExternalSquadResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.EXTERNAL_SQUAD_NOT_FOUND,
                };
            }

            await this.externalSquadActionsQueueService.addUsersToExternalSquad({
                externalSquadUuid: uuid,
            });

            return {
                isOk: true,
                response: new EventSentExternalSquadResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.ADD_USERS_TO_EXTERNAL_SQUAD_ERROR,
            };
        }
    }

    public async removeUsersFromExternalSquad(
        uuid: string,
    ): Promise<ICommandResponse<EventSentExternalSquadResponseModel>> {
        try {
            const externalSquad = await this.externalSquadRepository.findByUUID(uuid);

            if (!externalSquad) {
                return {
                    isOk: false,
                    ...ERRORS.EXTERNAL_SQUAD_NOT_FOUND,
                };
            }

            await this.externalSquadActionsQueueService.removeUsersFromExternalSquad({
                externalSquadUuid: uuid,
            });

            return {
                isOk: true,
                response: new EventSentExternalSquadResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.REMOVE_USERS_FROM_EXTERNAL_SQUAD_ERROR,
            };
        }
    }
}
