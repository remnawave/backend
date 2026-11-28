import { Response } from 'express';

import { Controller, Get, HttpStatus, Param, Res, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { GetSrrContext } from '@common/decorators/get-srr-context';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { PublicHttpExceptionFilter } from '@common/exception/public-http-exception.filter';
import { errorHandler } from '@common/helpers/error-handler.helper';
import {
    CONTROLLERS_INFO,
    SUBSCRIPTION_CONTROLLER,
    SUBSCRIPTION_ROUTES,
} from '@libs/contracts/api';
import { GetSubscriptionInfoByShortUuidCommand } from '@libs/contracts/commands';

import type { ISRRContext } from '@modules/subscription-response-rules/interfaces';
import { ResponseRulesEncryptionService } from '@modules/subscription-response-rules/services/response-rules-encryption.service';

import {
    GetSubscriptionByShortUuidByClientTypeParamDto,
    GetSubscriptionByShortUuidParamDto,
    GetSubscriptionInfoParamDto,
    GetSubscriptionInfoResponseDto,
} from '../dto';
import {
    SubscriptionNotFoundResponse,
    SubscriptionRawResponse,
    SubscriptionWithConfigResponse,
} from '../models';
import { SubscriptionService } from '../subscription.service';

@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION.tag)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_CONTROLLER)
export class SubscriptionController {
    constructor(
        private readonly subscriptionService: SubscriptionService,
        private readonly responseRulesEncryptionService: ResponseRulesEncryptionService,
    ) {}

    private applySrrHeaders(
        response: Response,
        srrContext: ISRRContext,
        applyMiddle?: () => void,
    ): void {
        if (srrContext.headersBefore) {
            response.set(srrContext.headersBefore);
        }
        applyMiddle?.();
        if (srrContext.headersToApply) {
            response.set(srrContext.headersToApply);
        }
    }

    private async finalizeSubscriptionResponse(
        response: Response,
        srrContext: ISRRContext,
        result: SubscriptionWithConfigResponse,
    ): Promise<Response> {
        let body = result.body;
        let contentType = result.contentType;

        if (srrContext.encryption) {
            body = await this.responseRulesEncryptionService.encrypt(body, srrContext.encryption);
            contentType = 'text/plain';
        }

        this.applySrrHeaders(response, srrContext, () => {
            response.set(result.headers);
        });

        return response.type(contentType).send(body);
    }

    @Endpoint({
        command: GetSubscriptionInfoByShortUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetSubscriptionInfoResponseDto,
    })
    async getSubscriptionInfoByShortUuid(
        @Param() param: GetSubscriptionInfoParamDto,
    ): Promise<GetSubscriptionInfoResponseDto> {
        const result = await this.subscriptionService.getSubscriptionInfo({
            searchBy: {
                uniqueField: param.shortUuid,
                uniqueFieldKey: 'shortUuid',
            },
            authenticated: false,
        });

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid'])
    async getSubscription(
        @GetSrrContext() srrContext: ISRRContext,
        @Param() param: GetSubscriptionByShortUuidParamDto,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            srrContext,
            param.shortUuid,
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            this.applySrrHeaders(response, srrContext);
            return response.status(200).send(result);
        }

        return this.finalizeSubscriptionResponse(response, srrContext, result);
    }

    @UseFilters(PublicHttpExceptionFilter)
    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid' + '/:clientType'])
    async getSubscriptionByClientType(
        @GetSrrContext() srrContext: ISRRContext,
        @Param() param: GetSubscriptionByShortUuidByClientTypeParamDto,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            srrContext,
            param.shortUuid,
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            this.applySrrHeaders(response, srrContext);
            return response.status(200).send(result);
        }

        return this.finalizeSubscriptionResponse(response, srrContext, result);
    }
}
