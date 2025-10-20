import type { Cache } from 'cache-manager';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import yaml from 'yaml';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { ICommandResponse } from '@common/types/command-response.type';
import { CACHE_KEYS, ERRORS, TSubscriptionTemplateType } from '@libs/contracts/constants';

import {
    DEFAULT_TEMPLATE_CLASH,
    DEFAULT_TEMPLATE_MIHOMO,
    DEFAULT_TEMPLATE_SINGBOX,
    DEFAULT_TEMPLATE_STASH,
    DEFAULT_TEMPLATE_XRAY_JSON,
} from './constants';
import { SubscriptionTemplateRepository } from './repositories/subscription-template.repository';
import { GetSubscriptionTemplatesResponseModel } from './models/get-templates.response.model';
import { SubscriptionTemplateEntity } from './entities/subscription-template.entity';
import { BaseTemplateResponseModel } from './models/base-template.response.model';
import { DeleteSubscriptionTemplateResponseModel } from './models';

const DEFAULT_TEMPLATE_NAME = 'Default';

@Injectable()
export class SubscriptionTemplateService {
    private readonly logger = new Logger(SubscriptionTemplateService.name);

    constructor(
        private readonly subscriptionTemplateRepository: SubscriptionTemplateRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    public async getAllTemplates(): Promise<
        ICommandResponse<GetSubscriptionTemplatesResponseModel>
    > {
        try {
            const templates = await this.subscriptionTemplateRepository.getAllTemplates(false);

            return {
                isOk: true,
                response: new GetSubscriptionTemplatesResponseModel(templates, templates.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_ALL_SUBSCRIPTION_TEMPLATES_ERROR,
            };
        }
    }

    public async getTemplateByUuid(
        uuid: string,
    ): Promise<ICommandResponse<BaseTemplateResponseModel>> {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(uuid);

            if (!template) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: new BaseTemplateResponseModel(template),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_SUBSCRIPTION_TEMPLATE_BY_UUID_ERROR,
            };
        }
    }

    public async updateTemplate(
        uuid: string,
        name: string | undefined,
        templateJson: object | undefined,
        encodedTemplateYaml: string | undefined,
    ): Promise<ICommandResponse<BaseTemplateResponseModel>> {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(uuid);

            if (!template) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND,
                };
            }

            if (name && name === DEFAULT_TEMPLATE_NAME) {
                return {
                    isOk: false,
                    ...ERRORS.RESERVED_TEMPLATE_NAME,
                };
            }

            const isYamlTemplate =
                template.templateType === 'MIHOMO' ||
                template.templateType === 'STASH' ||
                template.templateType === 'CLASH';

            const isJsonTemplate =
                template.templateType === 'XRAY_JSON' || template.templateType === 'SINGBOX';

            if (isYamlTemplate && templateJson !== undefined) {
                return {
                    isOk: false,
                    ...ERRORS.TEMPLATE_JSON_NOT_ALLOWED_FOR_YAML_TEMPLATE,
                };
            }

            if (isJsonTemplate && encodedTemplateYaml !== undefined) {
                return {
                    isOk: false,
                    ...ERRORS.TEMPLATE_YAML_NOT_ALLOWED_FOR_JSON_TEMPLATE,
                };
            }

            if (encodedTemplateYaml !== undefined && templateJson !== undefined) {
                return {
                    isOk: false,
                    ...ERRORS.TEMPLATE_JSON_AND_YAML_CANNOT_BE_UPDATED_SIMULTANEOUSLY,
                };
            }

            const updatedTemplate = await this.subscriptionTemplateRepository.update({
                uuid: template.uuid,
                name: name ?? undefined,
                templateJson: templateJson ?? undefined,
                templateYaml: encodedTemplateYaml
                    ? Buffer.from(encodedTemplateYaml, 'base64').toString('utf8')
                    : undefined,
            });

            await this.removeCachedTemplate(template.templateType, template.name);

            return {
                isOk: true,
                response: new BaseTemplateResponseModel(updatedTemplate),
            };
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'SubscriptionTemplates' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.TEMPLATE_NAME_ALREADY_EXISTS_FOR_THIS_TYPE };
                }
            }

            return {
                isOk: false,
                ...ERRORS.UPDATE_SUBSCRIPTION_TEMPLATE_ERROR,
            };
        }
    }

    public async deleteTemplate(
        uuid: string,
    ): Promise<ICommandResponse<DeleteSubscriptionTemplateResponseModel>> {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(uuid);

            if (!template) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND,
                };
            }

            if (template.name === DEFAULT_TEMPLATE_NAME) {
                return {
                    isOk: false,
                    ...ERRORS.RESERVED_TEMPLATE_CANNOT_BE_DELETED,
                };
            }

            await this.removeCachedTemplate(template.templateType, template.name);

            const deletedTemplate = await this.subscriptionTemplateRepository.deleteByUUID(uuid);

            return {
                isOk: true,
                response: new DeleteSubscriptionTemplateResponseModel(deletedTemplate),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_SUBSCRIPTION_TEMPLATE_ERROR,
            };
        }
    }

    public async createTemplate(
        name: string,
        templateType: TSubscriptionTemplateType,
    ): Promise<ICommandResponse<BaseTemplateResponseModel>> {
        try {
            if (name === DEFAULT_TEMPLATE_NAME) {
                return {
                    isOk: false,
                    ...ERRORS.RESERVED_TEMPLATE_NAME,
                };
            }

            let templateJson = undefined;
            let templateYaml = undefined;
            switch (templateType) {
                case 'CLASH':
                    templateYaml = DEFAULT_TEMPLATE_CLASH;
                    break;
                case 'MIHOMO':
                    templateYaml = DEFAULT_TEMPLATE_MIHOMO;
                    break;
                case 'STASH':
                    templateYaml = DEFAULT_TEMPLATE_STASH;
                    break;
                case 'SINGBOX':
                    templateJson = DEFAULT_TEMPLATE_SINGBOX;
                    break;
                case 'XRAY_JSON':
                    templateJson = DEFAULT_TEMPLATE_XRAY_JSON;
                    break;
            }

            const templateEntity = new SubscriptionTemplateEntity({
                name,
                templateType,
                templateJson,
                templateYaml,
            });

            const template = await this.subscriptionTemplateRepository.create(templateEntity);

            return {
                isOk: true,
                response: new BaseTemplateResponseModel(template),
            };
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'SubscriptionTemplates' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.TEMPLATE_NAME_ALREADY_EXISTS_FOR_THIS_TYPE };
                }
            }

            return {
                isOk: false,
                ...ERRORS.CREATE_SUBSCRIPTION_TEMPLATE_ERROR,
            };
        }
    }

    public async getJsonTemplateByType(templateType: TSubscriptionTemplateType): Promise<object> {
        try {
            const template =
                await this.subscriptionTemplateRepository.findFirstByTemplateType(templateType);

            if (!template || !template.templateJson) {
                throw new Error('Templates not found');
            }

            return template.templateJson;
        } catch (error) {
            this.logger.error(error);
            throw new Error('Failed to get template');
        }
    }

    public async getYamlTemplateByType(templateType: TSubscriptionTemplateType): Promise<string> {
        try {
            const template =
                await this.subscriptionTemplateRepository.findFirstByTemplateType(templateType);

            if (!template || !template.templateYaml) {
                throw new Error('Template not found');
            }

            return template.templateYaml;
        } catch (error) {
            this.logger.error(error);
            throw new Error('Failed to get template');
        }
    }

    public async getCachedTemplateByType(
        type: TSubscriptionTemplateType,
        name: string = DEFAULT_TEMPLATE_NAME,
    ): Promise<object> {
        const cached = await this.cacheManager.get<object>(
            CACHE_KEYS.SUBSCRIPTION_TEMPLATE(name, type),
        );

        if (cached) {
            return cached;
        }

        const template =
            await this.subscriptionTemplateRepository.getTemplateByNameAndTypeOrGetDefault(
                name,
                type,
            );

        if (!template) {
            this.logger.error(
                `Template not found: ${name} ${type}! Database modification detected. Restart Remnawave!`,
            );

            throw new Error('Template not found');
        }
        let templateContent: object | null = null;
        switch (template.templateType) {
            case 'MIHOMO':
            case 'STASH':
            case 'CLASH':
                templateContent = yaml.parse(template.templateYaml!);
                break;
            case 'SINGBOX':
            case 'XRAY_JSON':
                templateContent = template.templateJson;
                break;
        }

        await this.cacheManager.set(
            CACHE_KEYS.SUBSCRIPTION_TEMPLATE(name, type),
            templateContent,
            3_600_000,
        );

        if (!templateContent) {
            this.logger.error(
                `Template content is null: ${name} ${type}! Database modification detected. Restart Remnawave!`,
            );

            throw new Error('Template content is null');
        }

        return templateContent;
    }

    private async removeCachedTemplate(
        type: TSubscriptionTemplateType,
        name: string = DEFAULT_TEMPLATE_NAME,
    ): Promise<void> {
        await this.cacheManager.del(CACHE_KEYS.SUBSCRIPTION_TEMPLATE(name, type));
    }
}
