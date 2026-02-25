import { Request, Response, NextFunction } from 'express';

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { HttpExceptionWithErrorCodeType } from '@common/exception/http-exeception-with-error-code.type';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers/extract-hwid-headers.util';
import {
    ERRORS,
    RESPONSE_RULES_RESPONSE_TYPES,
    TRequestTemplateTypeKeys,
} from '@libs/contracts/constants';

import { GetCachedSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-cached-subscrtipion-settings';
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

            const settingsEntity = await this.queryBus.execute(
                new GetCachedSubscriptionSettingsQuery(),
            );

            if (!settingsEntity || !settingsEntity.responseRules) {
                throw new HttpExceptionWithErrorCodeType(
                    ERRORS.FORBIDDEN.message,
                    ERRORS.FORBIDDEN.code,
                    ERRORS.FORBIDDEN.httpCode,
                );
            }

            const headersToAppend: Record<string, string> = {
                'x-remnawave-injected-short-uuid': req.params.shortUuid,
            };

            if (req.params.clientType) {
                overrideClientType = req.params.clientType as unknown as TRequestTemplateTypeKeys;
                if (overrideClientType) {
                    headersToAppend['x-remnawave-injected-client-type'] = overrideClientType;
                }
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
                isXrayExtSupported: isXrayExtendedClient(userAgent),
                isMihomoExtSupported: isMihomoExtendedClient(userAgent),
                matchedResponseType: result.responseType,
                ip: req.clientIp,
                subscriptionSettings: settingsEntity,
            };

            if (result.matchedRule && result.matchedRule.responseModifications) {
                const mods = result.matchedRule.responseModifications;

                if (mods.headers && !mods.applyHeadersToEnd) {
                    mods.headers.forEach((header) => {
                        res.setHeader(header.key, header.value);
                    });
                }

                if (mods.headers && mods.applyHeadersToEnd) {
                    ssrContext.headersToApply = Object.fromEntries(
                        mods.headers.map((header) => [header.key, header.value]),
                    );
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
}
