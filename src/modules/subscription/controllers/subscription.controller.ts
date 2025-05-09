import { Request, Response } from 'express';

import { Controller, Get, HttpStatus, Param, Req, Res, UseFilters } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { SUBSCRIPTION_CONTROLLER, SUBSCRIPTION_ROUTES } from '@libs/contracts/api';
import { GetSubscriptionInfoByShortUuidCommand } from '@libs/contracts/commands';
import { REQUEST_TEMPLATE_TYPE } from '@libs/contracts/constants';

import {
    GetOutlineSubscriptionRequestDto,
    GetSubscriptionByShortUuidByClientTypeRequestDto,
    GetSubscriptionInfoRequestDto,
    GetSubscriptionInfoResponseDto,
} from '../dto';
import { GetSubscriptionByShortUuidRequestDto } from '../dto/get-subscription.dto';
import { SubscriptionNotFoundResponse, SubscriptionRawResponse } from '../models';
import { SubscriptionService } from '../subscription.service';

@ApiTags('Subscription Controller')
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
        const result = await this.subscriptionService.getSubscriptionInfoByShortUuid(shortUuid);

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
        @Param() { shortUuid }: GetSubscriptionByShortUuidRequestDto,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            shortUuid,
            (request.headers['user-agent'] as string) || '',
            ((request.headers['accept'] as string) || '').includes('text/html'),
            undefined,
            extractHwidHeaders(request),
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        return response.set(result.headers).type(result.contentType).send(result.body);
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
    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid' + '/:clientType'])
    async getSubscriptionByClientType(
        @Param() { shortUuid, clientType }: GetSubscriptionByShortUuidByClientTypeRequestDto,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            shortUuid,
            (request.headers['user-agent'] as string) || '',
            ((request.headers['accept'] as string) || '').includes('text/html'),
            clientType,
            extractHwidHeaders(request),
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        return response.set(result.headers).type(result.contentType).send(result.body);
    }

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiParam({
        name: 'type',
        type: String,
        description:
            'Subscription type (required if encodedTag is provided). Only SS is supported for now.',
        required: true,
        example: 'ss',
    })
    @ApiParam({
        name: 'encodedTag',
        type: String,
        description:
            'Base64 encoded tag for Outline config. This paramter is optional. It is required only when type=ss.',
        required: true,
        example: 'VGVzdGVy',
    })
    @Get([SUBSCRIPTION_ROUTES.GET_OUTLINE + '/:shortUuid/:type/:encodedTag'])
    async getSubscriptionWithType(
        @Param() { shortUuid }: GetOutlineSubscriptionRequestDto,
        @Req() request: Request,
        @Res() response: Response,
        @Param('type') type?: string,
        @Param('encodedTag') encodedTag?: string,
    ): Promise<Response> {
        let isOutlineConfig = false;
        if (type === 'ss' && encodedTag) {
            isOutlineConfig = true;
        }

        const result = await this.subscriptionService.getOutlineSubscriptionByShortUuid(
            shortUuid,
            (request.headers['user-agent'] as string) || '',
            ((request.headers['accept'] as string) || '').includes('text/html'),
            isOutlineConfig,
            encodedTag,
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        return response.set(result.headers).type(result.contentType).send(result.body);
    }
}
