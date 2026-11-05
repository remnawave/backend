import type { ISRRContext } from '../interfaces';

import { Request, Response, NextFunction } from 'express';

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { HttpExceptionWithErrorCodeType } from '@common/exception/http-exeception-with-error-code.type';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers/extract-hwid-headers.util';
import { toSafeHeaderValue } from '@common/utils/response-header-value.util';
import { truncateHeader } from '@common/utils/truncate-header.util';
import {
    ERRORS,
    RESPONSE_RULES_RESPONSE_TYPES,
    TRequestTemplateTypeKeys,
} from '@libs/contracts/constants';

import { GetCachedSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-cached-subscrtipion-settings';
import { isExtendedClient } from '@modules/subscription-template/constants';

import { ResponseRulesMatcherService } from '../services/response-rules-matcher.service';

@Injectable()
export class ResponseRulesMiddleware implements NestMiddleware {
    private readonly logger = new Logger(ResponseRulesMiddleware.name);
    private readonly regexCache = new Map<string, RegExp>();

    constructor(
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

            const userAgent = truncateHeader(req.headers['user-agent']);

            const settingsEntity = await this.queryBus.execute(
                new GetCachedSubscriptionSettingsQuery(),
            );

            if (!settingsEntity || !settingsEntity.responseRules || !userAgent) {
                throw new HttpExceptionWithErrorCodeType(
                    ERRORS.FORBIDDEN.message,
                    ERRORS.FORBIDDEN.code,
                    ERRORS.FORBIDDEN.httpCode,
                );
            }

            const headersToAppend: Record<string, string | string[]> = {
                'x-remnawave-injected-short-uuid': req.params.shortUuid,
            };

            if (req.params.clientType) {
                overrideClientType = req.params.clientType as unknown as TRequestTemplateTypeKeys;
            }

            const result = this.matcher.matchRules(
                settingsEntity.responseRules,
                {
                    ...req.headers,
                    ...headersToAppend,
                },
                overrideClientType,
            );

            if (!result.matched || !result.responseType) {
                throw new HttpExceptionWithErrorCodeType(
                    ERRORS.FORBIDDEN.message,
                    ERRORS.FORBIDDEN.code,
                    ERRORS.FORBIDDEN.httpCode,
                );
            }

            const ssrContext: ISRRContext = {
                userAgent,
                hwidHeaders: extractHwidHeaders(req),
                isExtendedClient: this.resolveExtendedClients(
                    userAgent,
                    result.matchedRule?.responseModifications?.additionalExtendedClientsRegex,
                ),
                matchedResponseType: result.responseType,
                matchedRuleName: result.matchedRule?.name,
                ip: req.clientIp,
                subscriptionSettings: settingsEntity,
            };

            if (result.matchedRule && result.matchedRule.responseModifications) {
                const mods = result.matchedRule.responseModifications;

                const headers = mods.headers ? this.getSafeHeaders(mods.headers) : undefined;

                if (headers && !mods.applyHeadersToEnd) {
                    headers.forEach(([key, value]) => {
                        res.setHeader(key, value);
                    });
                }

                if (headers && mods.applyHeadersToEnd) {
                    ssrContext.headersToApply = Object.fromEntries(headers);
                }

                if (mods.subscriptionTemplate) {
                    ssrContext.overrideTemplateName = mods.subscriptionTemplate;
                }
                if (mods.ignoreHostXrayJsonTemplate) {
                    ssrContext.ignoreHostXrayJsonTemplate = true;
                }
                if (mods.ignoreServeJsonAtBaseSubscription) {
                    ssrContext.ignoreServeJsonAtBaseSubscription = true;
                }

                if (mods.disableHwidCheck) {
                    ssrContext.disableHwidCheck = true;
                }

                if (mods.encryption) {
                    ssrContext.encryption = mods.encryption;
                }

                if (mods.excludeHostsByTags) {
                    ssrContext.excludeHostsByTags = new Set(mods.excludeHostsByTags);
                }

                if (mods.respondWithRemarks && mods.respondWithRemarks.length > 0) {
                    ssrContext.respondWithRemarks = mods.respondWithRemarks;
                }
            }

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

    private getSafeHeaders(headers: { key: string; value: string }[]): [string, string][] {
        const safeHeaders: [string, string][] = [];

        for (const { key, value } of headers) {
            const safeValue = toSafeHeaderValue(key, value);

            if (safeValue === null) {
                this.logger.warn(
                    `Skipping response rule header "${key}": value contains invalid characters`,
                );
                continue;
            }

            safeHeaders.push([key, safeValue]);
        }

        return safeHeaders;
    }

    private resolveExtendedClients(
        userAgent: string,
        clientRegexes: string[] | undefined,
    ): boolean {
        if (isExtendedClient(userAgent)) {
            return true;
        }

        if (clientRegexes && clientRegexes.length > 0) {
            for (const pattern of clientRegexes) {
                let compiled = this.regexCache.get(pattern);
                if (!compiled) {
                    compiled = new RegExp(pattern);
                    this.regexCache.set(pattern, compiled);
                }
                if (compiled.test(userAgent)) {
                    return true;
                }
            }
        }

        return false;
    }
}
