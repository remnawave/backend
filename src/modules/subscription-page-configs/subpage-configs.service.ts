import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { nanoid } from 'nanoid';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { cleanLocalizedTexts } from '@libs/subscription-page/models/subscription-page-config.validator';
import { CRUD_ACTIONS, ERRORS, EVENTS, TCrudActions } from '@libs/contracts/constants';
import { SubscriptionPageRawConfigSchema } from '@libs/subscription-page/models';
import { SUBPAGE_DEFAULT_CONFIG_UUID } from '@libs/subscription-page/constants';

import { ServiceEvent } from '@integration-modules/notifications/interfaces';

import { GetSubscriptionPageConfigsResponseModel } from './models/get-subscripion-page-configs.response.model';
import { BaseSubscriptionPageConfigResponseModel } from './models/base-subpage-config.response.model';
import { SubscriptionPageConfigRepository } from './repositories/subpage-configs.repository';
import { SubscriptionPageConfigEntity } from './entities/sub-page-config.entity';
import { DeleteSubscriptionPageConfigResponseModel } from './models';
import { DEFAULT_SUBPAGE_CONFIG } from './constants';

@Injectable()
export class SubscriptionPageConfigService {
    private readonly logger = new Logger(SubscriptionPageConfigService.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly subscriptionPageConfigRepository: SubscriptionPageConfigRepository,
    ) {}

    public async getAllConfigs(): Promise<TResult<GetSubscriptionPageConfigsResponseModel>> {
        try {
            const configs = await this.subscriptionPageConfigRepository.getAllConfigs(false);

            return ok(new GetSubscriptionPageConfigsResponseModel(configs, configs.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_SUBSCRIPTION_PAGE_CONFIGS_ERROR);
        }
    }

    public async getConfigByUuid(
        uuid: string,
    ): Promise<TResult<BaseSubscriptionPageConfigResponseModel>> {
        try {
            const config = await this.subscriptionPageConfigRepository.findByUUID(uuid);

            if (!config) {
                return fail(ERRORS.SUBSCRIPTION_PAGE_CONFIG_NOT_FOUND);
            }

            return ok(new BaseSubscriptionPageConfigResponseModel(config));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_SUBSCRIPTION_PAGE_CONFIG_BY_UUID_ERROR);
        }
    }

    public async updateConfig(
        uuid: string,
        name: string | undefined,
        inputConfig: object | undefined,
    ): Promise<TResult<BaseSubscriptionPageConfigResponseModel>> {
        try {
            const config = await this.subscriptionPageConfigRepository.findByUUID(uuid);

            if (!config) {
                return fail(ERRORS.SUBSCRIPTION_PAGE_CONFIG_NOT_FOUND);
            }

            if (inputConfig) {
                const validatedConfig =
                    await SubscriptionPageRawConfigSchema.safeParseAsync(inputConfig);

                if (!validatedConfig.success) {
                    this.logger.error(
                        validatedConfig.error.errors
                            .map(
                                (err) =>
                                    `${err.path.length ? `${err.path.join('.')}: ` : ''}${err.message}`,
                            )
                            .join(', '),
                    );
                    return fail(ERRORS.INVALID_SUBSCRIPTION_PAGE_CONFIG);
                }

                validatedConfig.data.platforms = cleanLocalizedTexts(
                    validatedConfig.data.platforms,
                    validatedConfig.data.locales,
                );

                validatedConfig.data.baseTranslations = cleanLocalizedTexts(
                    validatedConfig.data.baseTranslations,
                    validatedConfig.data.locales,
                );

                inputConfig = validatedConfig.data;
            }

            const updatedConfig = await this.subscriptionPageConfigRepository.update({
                uuid: config.uuid,
                name: name ?? undefined,
                config: inputConfig ?? undefined,
            });

            await this.emitSubpageConfigChangedEvent(CRUD_ACTIONS.UPDATED, updatedConfig.uuid);

            return ok(new BaseSubscriptionPageConfigResponseModel(updatedConfig));
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'SubscriptionPageConfig' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.CONFIG_NAME_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.UPDATE_SUBSCRIPTION_PAGE_CONFIG_ERROR);
        }
    }

    public async deleteConfig(
        uuid: string,
    ): Promise<TResult<DeleteSubscriptionPageConfigResponseModel>> {
        try {
            const config = await this.subscriptionPageConfigRepository.findByUUID(uuid);

            if (!config) {
                return fail(ERRORS.SUBSCRIPTION_PAGE_CONFIG_NOT_FOUND);
            }

            if (config.uuid === SUBPAGE_DEFAULT_CONFIG_UUID) {
                return fail(ERRORS.RESERVED_SUBPAGE_CONFIG_CANT_BE_DELETED);
            }

            const deletedConfig = await this.subscriptionPageConfigRepository.deleteByUUID(uuid);

            await this.emitSubpageConfigChangedEvent(CRUD_ACTIONS.DELETED, config.uuid);

            return ok(new DeleteSubscriptionPageConfigResponseModel(deletedConfig));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_SUBSCRIPTION_PAGE_CONFIG_ERROR);
        }
    }

    public async createConfig(
        name: string,
    ): Promise<TResult<BaseSubscriptionPageConfigResponseModel>> {
        try {
            const configEntity = new SubscriptionPageConfigEntity({
                name,
                config: DEFAULT_SUBPAGE_CONFIG,
            });

            const config = await this.subscriptionPageConfigRepository.create(configEntity);

            await this.emitSubpageConfigChangedEvent(CRUD_ACTIONS.CREATED, config.uuid);

            return ok(new BaseSubscriptionPageConfigResponseModel(config));
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'SubscriptionPageConfig' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return fail(ERRORS.CONFIG_NAME_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.CREATE_SUBSCRIPTION_PAGE_CONFIG_ERROR);
        }
    }

    public async reorderSubscriptionPageConfigs(
        dto: {
            uuid: string;
            viewPosition: number;
        }[],
    ): Promise<TResult<GetSubscriptionPageConfigsResponseModel>> {
        try {
            await this.subscriptionPageConfigRepository.reorderMany(dto);

            return await this.getAllConfigs();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GENERIC_REORDER_ERROR);
        }
    }

    public async cloneSubscriptionPageConfig(
        cloneFromUuid: string,
    ): Promise<TResult<BaseSubscriptionPageConfigResponseModel>> {
        try {
            const config = await this.subscriptionPageConfigRepository.findByUUID(cloneFromUuid);

            if (!config) {
                return fail(ERRORS.SUBSCRIPTION_PAGE_CONFIG_NOT_FOUND);
            }

            const newConfig = await this.subscriptionPageConfigRepository.create(
                new SubscriptionPageConfigEntity({
                    name: `Clone ${nanoid(5)}`,
                    config: config.config,
                }),
            );

            return ok(new BaseSubscriptionPageConfigResponseModel(newConfig));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_SUBSCRIPTION_PAGE_CONFIG_ERROR);
        }
    }

    private async emitSubpageConfigChangedEvent(action: TCrudActions, uuid: string): Promise<void> {
        this.eventEmitter.emit(
            EVENTS.SERVICE.SUBPAGE_CONFIG_CHANGED,
            new ServiceEvent(EVENTS.SERVICE.SUBPAGE_CONFIG_CHANGED, {
                subpageConfig: { action, uuid },
            }),
        );
    }
}
