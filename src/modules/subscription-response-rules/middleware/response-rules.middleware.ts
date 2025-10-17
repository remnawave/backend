import type { Cache } from 'cache-manager';

import { Request, Response, NextFunction } from 'express';

import { Injectable, NestMiddleware, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { QueryBus } from '@nestjs/cqrs';

import { HttpExceptionWithErrorCodeType } from '@common/exception/http-exeception-with-error-code.type';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers/extract-hwid-headers.util';
import { ICommandResponse } from '@common/types/command-response.type';
import {
    CACHE_KEYS,
    ERRORS,
    RESPONSE_RULES_RESPONSE_TYPES,
    TRequestTemplateTypeKeys,
} from '@libs/contracts/constants';

import { GetSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-subscription-settings/get-subscription-settings.query';
import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import {
    isMihomoExtendedClient,
    isXrayExtendedClient,
} from '@modules/subscription-template/constants';

import { ResponseRulesMatcherService } from '../services/response-rules-matcher.service';
import { ISRRContext } from '../interfaces';

@Injectable()
export class ResponseRulesMiddleware implements NestMiddleware {
    private readonly logger = new Logger(ResponseRulesMiddleware.name);
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly queryBus: QueryBus,
        private readonly matcher: ResponseRulesMatcherService,
    ) {}

    async use(
        req: { srrContext: ISRRContext; clientIp: string } & Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            let overrideClientType: TRequestTemplateTypeKeys | undefined;
            const userAgent = req.headers['user-agent'] as string;

            const settingsEntity = await this.getCachedSubscriptionSettings();

            if (!settingsEntity || !settingsEntity.responseRules) {
                throw new HttpExceptionWithErrorCodeType(
                    ERRORS.FORBIDDEN.message,
                    ERRORS.FORBIDDEN.code,
                    ERRORS.FORBIDDEN.httpCode,
                );
            }

            if (req.params.clientType) {
                overrideClientType = req.params.clientType as unknown as TRequestTemplateTypeKeys;
            }

            const result = this.matcher.matchRules(
                settingsEntity.responseRules,
                req.headers,
                overrideClientType,
            );

            if (!result.matched || !result.responseType) {
                throw new HttpExceptionWithErrorCodeType(
                    ERRORS.FORBIDDEN.message,
                    ERRORS.FORBIDDEN.code,
                    ERRORS.FORBIDDEN.httpCode,
                );
            }

            if (result.matchedRule) {
                if (result.matchedRule.responseModifications) {
                    if (result.matchedRule.responseModifications.headers) {
                        result.matchedRule.responseModifications.headers.forEach((header) => {
                            res.setHeader(header.key, header.value);
                        });
                    }
                }
            }

            const ssrContext: ISRRContext = {
                userAgent,
                hwidHeaders: extractHwidHeaders(req),
                isXrayExtSupported: isXrayExtendedClient(userAgent),
                isMihomoExtSupported: isMihomoExtendedClient(userAgent),
                matchedResponseType: result.responseType,
                ip: req.clientIp,
                subscriptionSettings: settingsEntity,
            };

            switch (ssrContext.matchedResponseType) {
                case RESPONSE_RULES_RESPONSE_TYPES.BLOCK:
                    throw new HttpExceptionWithErrorCodeType(
                        ERRORS.FORBIDDEN.message,
                        ERRORS.FORBIDDEN.code,
                        ERRORS.FORBIDDEN.httpCode,
                    );

                case RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_404:
                    throw new HttpExceptionWithErrorCodeType('Not Found', 'E404', 404);

                case RESPONSE_RULES_RESPONSE_TYPES.STATUS_CODE_451:
                    throw new HttpExceptionWithErrorCodeType(
                        'Unavailable For Legal Reasons',
                        'E451',
                        451,
                    );

                case RESPONSE_RULES_RESPONSE_TYPES.SOCKET_DROP:
                    res.socket?.destroy();
                    return;
                default:
                    break;
            }

            req.srrContext = ssrContext;

            next();
        } catch (error) {
            next(error);
        }
    }

    private async getCachedSubscriptionSettings(): Promise<SubscriptionSettingsEntity | null> {
        const cached = await this.cacheManager.get<SubscriptionSettingsEntity>(
            CACHE_KEYS.SUBSCRIPTION_SETTINGS,
        );

        if (cached) {
            return cached;
        }

        const settings = await this.getSubscriptionSettings();
        if (!settings.isOk || !settings.response) {
            return null;
        }

        await this.cacheManager.set(CACHE_KEYS.SUBSCRIPTION_SETTINGS, settings.response, 3_600_000);

        return settings.response;
    }

    private async getSubscriptionSettings(): Promise<ICommandResponse<SubscriptionSettingsEntity>> {
        return this.queryBus.execute<
            GetSubscriptionSettingsQuery,
            ICommandResponse<SubscriptionSettingsEntity>
        >(new GetSubscriptionSettingsQuery());
    }
}
