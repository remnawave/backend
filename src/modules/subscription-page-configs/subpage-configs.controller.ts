import { CONTROLLERS_INFO, SUBSCRIPTION_PAGE_CONFIGS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import {
    CloneSubpageConfigCommand,
    CreateSubpageConfigCommand,
    DeleteSubpageConfigCommand,
    GetSubpageConfigCommand,
    GetSubpageConfigsCommand,
    ReorderSubpageConfigsCommand,
    UpdateSubpageConfigCommand,
} from '@libs/contracts/commands';
import {
    GetSubpageConfigsTagsCommand,
    SetSubpageConfigTagsCommand,
} from '@libs/contracts/commands';

import {
    GetSubpageConfigsTagsResponseDto,
    SetSubpageConfigsTagsBodyDto,
    SetSubpageConfigsTagsResponseDto,
} from './dtos';
import {
    ReorderSubpageConfigsBodyDto,
    ReorderSubpageConfigsResponseDto,
    GetSubpageConfigsResponseDto,
    GetSubpageConfigResponseDto,
    UpdateSubpageConfigBodyDto,
    UpdateSubpageConfigResponseDto,
    DeleteSubpageConfigParamDto,
    CreateSubpageConfigBodyDto,
    CreateSubpageConfigResponseDto,
    GetSubpageConfigParamDto,
    CloneSubpageConfigResponseDto,
    CloneSubpageConfigBodyDto,
} from './dtos/subpage-configs.dtos';
import { SubscriptionPageConfigService } from './subpage-configs.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.SUBSCRIPTION_PAGE_CONFIGS.resource)
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_PAGE_CONFIGS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_PAGE_CONFIGS_CONTROLLER)
export class SubscriptionPageConfigController {
    constructor(private readonly subscriptionPageConfigService: SubscriptionPageConfigService) {}

    @Endpoint({
        command: GetSubpageConfigsTagsCommand,
        httpCode: HttpStatus.OK,
        type: GetSubpageConfigsTagsResponseDto,
    })
    async getTags(): Promise<GetSubpageConfigsTagsResponseDto> {
        const result = await this.subscriptionPageConfigService.getTags();

        const data = errorHandler(result);
        return {
            response: { tags: data },
        };
    }

    @Endpoint({
        command: SetSubpageConfigTagsCommand,
        httpCode: HttpStatus.OK,
        type: SetSubpageConfigsTagsResponseDto,
    })
    async setTags(
        @Body() body: SetSubpageConfigsTagsBodyDto,
    ): Promise<SetSubpageConfigsTagsResponseDto> {
        const result = await this.subscriptionPageConfigService.setTags(body.uuid, body.tags);

        const data = errorHandler(result);
        return {
            response: { uuid: body.uuid, tags: data },
        };
    }


    @Endpoint({
        type: GetSubpageConfigsResponseDto,
        command: GetSubpageConfigsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllConfigs(): Promise<GetSubpageConfigsResponseDto> {
        const result = await this.subscriptionPageConfigService.getAllConfigs();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: GetSubpageConfigResponseDto,
        command: GetSubpageConfigCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfigByUuid(
        @Param() paramData: GetSubpageConfigParamDto,
    ): Promise<GetSubpageConfigResponseDto> {
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

    @Endpoint({
        type: UpdateSubpageConfigResponseDto,
        command: UpdateSubpageConfigCommand,
        httpCode: HttpStatus.OK,
    })
    async updateConfig(
        @Body() body: UpdateSubpageConfigBodyDto,
    ): Promise<UpdateSubpageConfigResponseDto> {
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

    @Endpoint({
        command: DeleteSubpageConfigCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteConfig(@Param() param: DeleteSubpageConfigParamDto) {
        const result = await this.subscriptionPageConfigService.deleteConfig(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        type: CreateSubpageConfigResponseDto,
        command: CreateSubpageConfigCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createConfig(
        @Body() body: CreateSubpageConfigBodyDto,
    ): Promise<CreateSubpageConfigResponseDto> {
        const result = await this.subscriptionPageConfigService.createConfig(body.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: ReorderSubpageConfigsResponseDto,
        command: ReorderSubpageConfigsCommand,
        httpCode: HttpStatus.OK,
    })
    async reorderSubscriptionPageConfigs(
        @Body() body: ReorderSubpageConfigsBodyDto,
    ): Promise<ReorderSubpageConfigsResponseDto> {
        const result = await this.subscriptionPageConfigService.reorderSubscriptionPageConfigs(
            body.items,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: CloneSubpageConfigResponseDto,
        command: CloneSubpageConfigCommand,
        httpCode: HttpStatus.OK,
    })
    async cloneSubscriptionPageConfig(
        @Body() body: CloneSubpageConfigBodyDto,
    ): Promise<CloneSubpageConfigResponseDto> {
        const result = await this.subscriptionPageConfigService.cloneSubscriptionPageConfig(
            body.cloneFromUuid,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

}
