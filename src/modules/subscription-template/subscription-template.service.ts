import type { Cache } from 'cache-manager';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import yaml from 'yaml';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, ERRORS, TSubscriptionTemplateType } from '@libs/contracts/constants';
import { RemnawaveInjectorSchema } from '@libs/contracts/models';

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
import { ReorderSubscriptionTemplatesRequestDto } from './dtos';

const DEFAULT_TEMPLATE_NAME = 'Default';

@Injectable()
export class SubscriptionTemplateService {
    private readonly logger = new Logger(SubscriptionTemplateService.name);

    constructor(
        private readonly subscriptionTemplateRepository: SubscriptionTemplateRepository,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    public async getAllTemplates(): Promise<TResult<GetSubscriptionTemplatesResponseModel>> {
        try {
            const templates = await this.subscriptionTemplateRepository.getAllTemplates(false);

            return ok(new GetSubscriptionTemplatesResponseModel(templates, templates.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_SUBSCRIPTION_TEMPLATES_ERROR);
        }
    }

    public async getTemplateByUuid(uuid: string): Promise<TResult<BaseTemplateResponseModel>> {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(uuid);

            if (!template) {
                return fail(ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND);
            }

            return ok(new BaseTemplateResponseModel(template));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_SUBSCRIPTION_TEMPLATE_BY_UUID_ERROR);
        }
    }

    public async updateTemplate(
        uuid: string,
        name: string | undefined,
        templateJson: object | undefined,
        encodedTemplateYaml: string | undefined,
    ): Promise<TResult<BaseTemplateResponseModel>> {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(uuid);

            if (!template) {
                return fail(ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND);
            }

            if (name && name === DEFAULT_TEMPLATE_NAME) {
                return fail(ERRORS.RESERVED_TEMPLATE_NAME);
            }

            const isYamlTemplate =
                template.templateType === 'MIHOMO' ||
                template.templateType === 'STASH' ||
                template.templateType === 'CLASH';

            const isJsonTemplate =
                template.templateType === 'XRAY_JSON' || template.templateType === 'SINGBOX';

            if (isYamlTemplate && templateJson !== undefined) {
                return fail(ERRORS.TEMPLATE_JSON_NOT_ALLOWED_FOR_YAML_TEMPLATE);
            }

            if (isJsonTemplate && encodedTemplateYaml !== undefined) {
                return fail(ERRORS.TEMPLATE_YAML_NOT_ALLOWED_FOR_JSON_TEMPLATE);
            }

            if (encodedTemplateYaml !== undefined && templateJson !== undefined) {
                return fail(ERRORS.TEMPLATE_JSON_AND_YAML_CANNOT_BE_UPDATED_SIMULTANEOUSLY);
            }

            if (
                isJsonTemplate &&
                templateJson &&
                typeof templateJson === 'object' &&
                'remnawave' in templateJson
            ) {
                const result = await RemnawaveInjectorSchema.safeParseAsync(templateJson.remnawave);
                if (!result.success) {
                    return fail(ERRORS.INVALID_REMNAWAVE_INJECTOR);
                }
                for (const injector of result.data?.injectHosts ?? []) {
                    if (
                        (injector.selector.type === 'remarkRegex' ||
                            injector.selector.type === 'tagRegex') &&
                        typeof injector.selector.pattern === 'string'
                    ) {
                        try {
                            new RegExp(injector.selector.pattern);
                        } catch (error: unknown) {
                            this.logger.error(
                                `Invalid regex pattern for injectHosts entry: ${injector.selector.pattern}, ${(error as Error).message}`,
                            );
                            return fail(ERRORS.INVALID_REMNAWAVE_INJECTOR);
                        }
                    }

                    if (
                        !injector.tagPrefix &&
                        !injector.useHostRemarkAsTag &&
                        !injector.useHostTagAsTag
                    ) {
                        this.logger.error(
                            `At least one of tagPrefix, useHostRemarkAsTag, or useHostTagAsTag must be provided for injectHosts entry: ${JSON.stringify(injector)}`,
                        );
                        return fail(ERRORS.INVALID_REMNAWAVE_INJECTOR);
                    }
                }
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

            return ok(new BaseTemplateResponseModel(updatedTemplate));
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
                    return fail(ERRORS.TEMPLATE_NAME_ALREADY_EXISTS_FOR_THIS_TYPE);
                }
            }

            return fail(ERRORS.UPDATE_SUBSCRIPTION_TEMPLATE_ERROR);
        }
    }

    public async deleteTemplate(
        uuid: string,
    ): Promise<TResult<DeleteSubscriptionTemplateResponseModel>> {
        try {
            const template = await this.subscriptionTemplateRepository.findByUUID(uuid);

            if (!template) {
                return fail(ERRORS.SUBSCRIPTION_TEMPLATE_NOT_FOUND);
            }

            if (template.name === DEFAULT_TEMPLATE_NAME) {
                return fail(ERRORS.RESERVED_TEMPLATE_CANNOT_BE_DELETED);
            }

            await this.removeCachedTemplate(template.templateType, template.name);

            const deletedTemplate = await this.subscriptionTemplateRepository.deleteByUUID(uuid);

            return ok(new DeleteSubscriptionTemplateResponseModel(deletedTemplate));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_SUBSCRIPTION_TEMPLATE_ERROR);
        }
    }

    public async createTemplate(
        name: string,
        templateType: TSubscriptionTemplateType,
    ): Promise<TResult<BaseTemplateResponseModel>> {
        try {
            if (name === DEFAULT_TEMPLATE_NAME) {
                return fail(ERRORS.RESERVED_TEMPLATE_NAME);
            }

            if (templateType === 'XRAY_BASE64') {
                return fail(ERRORS.TEMPLATE_TYPE_NOT_ALLOWED);
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

            return ok(new BaseTemplateResponseModel(template));
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
                    return fail(ERRORS.TEMPLATE_NAME_ALREADY_EXISTS_FOR_THIS_TYPE);
                }
            }

            return fail(ERRORS.CREATE_SUBSCRIPTION_TEMPLATE_ERROR);
        }
    }

    public async reorderSubscriptionTemplates(
        dto: ReorderSubscriptionTemplatesRequestDto,
    ): Promise<TResult<GetSubscriptionTemplatesResponseModel>> {
        try {
            await this.subscriptionTemplateRepository.reorderMany(dto.items);

            return await this.getAllTemplates();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GENERIC_REORDER_ERROR);
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
