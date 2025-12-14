import { CONTROLLERS_INFO, SUBSCRIPTION_PAGE_CONFIGS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateSubscriptionPageConfigCommand,
    DeleteSubscriptionPageConfigCommand,
    GetSubscriptionPageConfigCommand,
    GetSubscriptionPageConfigsCommand,
    ReorderSubscriptionPageConfigsCommand,
    UpdateSubscriptionPageConfigCommand,
} from '@libs/contracts/commands';

import {
    ReorderSubscriptionPageConfigsRequestDto,
    ReorderSubscriptionPageConfigsResponseDto,
    GetSubscriptionPageConfigsResponseDto,
    GetSubscriptionPageConfigResponseDto,
    UpdateSubscriptionPageConfigRequestDto,
    UpdateSubscriptionPageConfigResponseDto,
    DeleteSubscriptionPageConfigRequestDto,
    DeleteSubscriptionPageConfigResponseDto,
    CreateSubscriptionPageConfigRequestDto,
    CreateSubscriptionPageConfigResponseDto,
    GetSubscriptionPageConfigRequestDto,
} from './dtos/subpage-configs.dtos';
import { SubscriptionPageConfigService } from './subpage-configs.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_PAGE_CONFIGS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_PAGE_CONFIGS_CONTROLLER)
export class SubscriptionPageConfigController {
    constructor(private readonly subscriptionPageConfigService: SubscriptionPageConfigService) {}

    @ApiOkResponse({
        type: GetSubscriptionPageConfigsResponseDto,
        description: 'Subscription page configs retrieved successfully',
    })
    @Endpoint({
        command: GetSubscriptionPageConfigsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllConfigs(): Promise<GetSubscriptionPageConfigsResponseDto> {
        const result = await this.subscriptionPageConfigService.getAllConfigs();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetSubscriptionPageConfigResponseDto,
        description: 'Subscription page config retrieved successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Subscription page config UUID' })
    @Endpoint({
        command: GetSubscriptionPageConfigCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfigByUuid(
        @Param() paramData: GetSubscriptionPageConfigRequestDto,
    ): Promise<GetSubscriptionPageConfigResponseDto> {
        const { uuid } = paramData;
        const result = await this.subscriptionPageConfigService.getConfigByUuid(uuid);
        const data = errorHandler(result);
        return {
            response: {
                ...data,
                config: data.config!,
            },
        };
    }

    @ApiOkResponse({
        type: UpdateSubscriptionPageConfigResponseDto,
        description: 'Subscription page config updated successfully',
    })
    @Endpoint({
        command: UpdateSubscriptionPageConfigCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateSubscriptionPageConfigRequestDto,
    })
    async updateConfig(
        @Body() body: UpdateSubscriptionPageConfigRequestDto,
    ): Promise<UpdateSubscriptionPageConfigResponseDto> {
        const result = await this.subscriptionPageConfigService.updateConfig(
            body.uuid,
            body.name?.trim() ?? undefined,
            body.config ?? undefined,
        );

        const data = errorHandler(result);
        return {
            response: {
                ...data,
                config: data.config!,
            },
        };
    }

    @ApiOkResponse({
        type: DeleteSubscriptionPageConfigResponseDto,
        description: 'Subscription page config deleted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Subscription page config UUID' })
    @Endpoint({
        command: DeleteSubscriptionPageConfigCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteConfig(
        @Param() paramData: DeleteSubscriptionPageConfigRequestDto,
    ): Promise<DeleteSubscriptionPageConfigResponseDto> {
        const result = await this.subscriptionPageConfigService.deleteConfig(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: CreateSubscriptionPageConfigResponseDto,
        description: 'Subscription page config created successfully',
    })
    @Endpoint({
        command: CreateSubscriptionPageConfigCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateSubscriptionPageConfigRequestDto,
    })
    async createConfig(
        @Body() body: CreateSubscriptionPageConfigRequestDto,
    ): Promise<CreateSubscriptionPageConfigResponseDto> {
        const result = await this.subscriptionPageConfigService.createConfig(body.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: ReorderSubscriptionPageConfigsResponseDto,
        description: 'Subscription page configs reordered successfully',
    })
    @Endpoint({
        command: ReorderSubscriptionPageConfigsCommand,
        httpCode: HttpStatus.OK,
        apiBody: ReorderSubscriptionPageConfigsRequestDto,
    })
    async reorderSubscriptionPageConfigs(
        @Body() body: ReorderSubscriptionPageConfigsRequestDto,
    ): Promise<ReorderSubscriptionPageConfigsResponseDto> {
        const result = await this.subscriptionPageConfigService.reorderSubscriptionPageConfigs(
            body.items,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
