import { Request, Response } from 'express';

import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Req,
    Res,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PublicHttpExceptionFilter } from '@common/exception/public-http-exception.filter';
import { OptionalJwtGuard } from '@common/guards/jwt-guards/optional-jwt-guard';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { GetOptionalAuth } from '@common/decorators/get-optional-auth';
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
    GetOutlineSubscriptionRequestDto,
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
    @UseGuards(OptionalJwtGuard)
    async getSubscriptionInfoByShortUuid(
        @Param() { shortUuid }: GetSubscriptionInfoRequestDto,
        @GetOptionalAuth() authenticatedFromBrowser: boolean,
    ): Promise<GetSubscriptionInfoResponseDto> {
        const result = await this.subscriptionService.getSubscriptionInfoByShortUuid(
            shortUuid,
            undefined,
            authenticatedFromBrowser,
        );

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
        if (!encodedTag || type !== 'ss') {
            return response.status(404).send(new SubscriptionNotFoundResponse());
        }

        const result = await this.subscriptionService.getOutlineSubscriptionByShortUuid(
            shortUuid,
            request.headers['user-agent'] as string,
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
