import { Request, Response } from 'express';

import { Controller, Get, HttpStatus, Param, Res, UseFilters } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PublicHttpExceptionFilter } from '@common/exception/public-http-exception.filter';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { GetSrrContext } from '@common/decorators/get-srr-context';
import { Endpoint } from '@common/decorators/base-endpoint';
import {
    CONTROLLERS_INFO,
    SUBSCRIPTION_CONTROLLER,
    SUBSCRIPTION_ROUTES,
} from '@libs/contracts/api';
import { GetSubscriptionInfoByShortUuidCommand } from '@libs/contracts/commands';
import { REQUEST_TEMPLATE_TYPE } from '@libs/contracts/constants';

import { ISRRContext } from '@modules/subscription-response-rules/interfaces';

import {
    GetSubscriptionByShortUuidByClientTypeRequestDto,
    GetSubscriptionInfoRequestDto,
    GetSubscriptionInfoResponseDto,
} from '../dto';
import { GetSubscriptionByShortUuidRequestDto } from '../dto/get-subscription.dto';
import { SubscriptionNotFoundResponse, SubscriptionRawResponse } from '../models';
import { SubscriptionService } from '../subscription.service';

@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION.tag)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_CONTROLLER)
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Subscription info fetched successfully',
        type: GetSubscriptionInfoResponseDto,
    })
    @Endpoint({
        command: GetSubscriptionInfoByShortUuidCommand,
        httpCode: HttpStatus.OK,
    })
    async getSubscriptionInfoByShortUuid(
        @Param() { shortUuid }: GetSubscriptionInfoRequestDto,
    ): Promise<GetSubscriptionInfoResponseDto> {
        const result = await this.subscriptionService.getSubscriptionInfo({
            searchBy: {
                uniqueField: shortUuid,
                uniqueFieldKey: 'shortUuid',
            },
            authenticated: false,
        });

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid'])
    async getSubscription(
        @GetSrrContext() srrContext: ISRRContext,
        @Param() { shortUuid }: GetSubscriptionByShortUuidRequestDto,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            srrContext,
            shortUuid,
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        response.set({
            ...result.headers,
            ...srrContext.headersToApply,
        });

        return response.type(result.contentType).send(result.body);
    }

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiParam({
        name: 'clientType',
        type: String,
        description: 'Client type',
        required: true,
        enum: REQUEST_TEMPLATE_TYPE,
    })
    @UseFilters(PublicHttpExceptionFilter)
    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid' + '/:clientType'])
    async getSubscriptionByClientType(
        @GetSrrContext() srrContext: ISRRContext,
        @Param() { shortUuid }: GetSubscriptionByShortUuidByClientTypeRequestDto,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            srrContext,
            shortUuid,
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        response.set({
            ...result.headers,
            ...srrContext.headersToApply,
        });

        return response.type(result.contentType).send(result.body);
    }
}
