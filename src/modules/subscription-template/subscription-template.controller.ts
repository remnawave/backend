import { CONTROLLERS_INFO, SUBSCRIPTION_TEMPLATE_CONTROLLER } from '@contract/api';
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
    CreateSubscriptionTemplateCommand,
    DeleteSubscriptionTemplateCommand,
    GetSubscriptionTemplateCommand,
    GetSubscriptionTemplatesCommand,
    ReorderSubscriptionTemplateCommand,
    UpdateSubscriptionTemplateCommand,
} from '@libs/contracts/commands';
import {
    GetSubscriptionTemplatesTagsCommand,
    SetSubscriptionTemplateTagsCommand,
} from '@libs/contracts/commands';

import {
    GetSubscriptionTemplatesTagsResponseDto,
    SetSubscriptionTemplatesTagsBodyDto,
    SetSubscriptionTemplatesTagsResponseDto,
} from './dtos';
import {
    CreateSubscriptionTemplateBodyDto,
    CreateSubscriptionTemplateResponseDto,
    DeleteSubscriptionTemplateParamDto,
    GetTemplateParamDto,
    GetTemplateResponseDto,
    GetTemplatesResponseDto,
    ReorderSubscriptionTemplatesBodyDto,
    ReorderSubscriptionTemplatesResponseDto,
    UpdateTemplateResponseDto,
    UpdateTemplateBodyDto,
} from './dtos/subscription-templates.dtos';
import { SubscriptionTemplateService } from './subscription-template.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.SUBSCRIPTION_TEMPLATE.resource)
@ApiTags(CONTROLLERS_INFO.SUBSCRIPTION_TEMPLATE.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_TEMPLATE_CONTROLLER)
export class SubscriptionTemplateController {
    constructor(private readonly subscriptionTemplateService: SubscriptionTemplateService) {}

    @Endpoint({
        command: GetSubscriptionTemplatesTagsCommand,
        httpCode: HttpStatus.OK,
        type: GetSubscriptionTemplatesTagsResponseDto,
    })
    async getTags(): Promise<GetSubscriptionTemplatesTagsResponseDto> {
        const result = await this.subscriptionTemplateService.getTags();

        const data = errorHandler(result);
        return {
            response: { tags: data },
        };
    }

    @Endpoint({
        command: SetSubscriptionTemplateTagsCommand,
        httpCode: HttpStatus.OK,
        type: SetSubscriptionTemplatesTagsResponseDto,
    })
    async setTags(
        @Body() body: SetSubscriptionTemplatesTagsBodyDto,
    ): Promise<SetSubscriptionTemplatesTagsResponseDto> {
        const result = await this.subscriptionTemplateService.setTags(body.uuid, body.tags);

        const data = errorHandler(result);
        return {
            response: { uuid: body.uuid, tags: data },
        };
    }


    @Endpoint({
        command: GetSubscriptionTemplatesCommand,
        httpCode: HttpStatus.OK,
        type: GetTemplatesResponseDto,
    })
    async getAllTemplates(): Promise<GetTemplatesResponseDto> {
        const result = await this.subscriptionTemplateService.getAllTemplates();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
        type: GetTemplateResponseDto,
    })
    async getTemplateByUuid(@Param() param: GetTemplateParamDto): Promise<GetTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.getTemplateByUuid(param.uuid);
        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: UpdateTemplateResponseDto,
        command: UpdateSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
    })
    async updateTemplate(@Body() body: UpdateTemplateBodyDto): Promise<UpdateTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.updateTemplate(
            body.uuid,
            body.name?.trim() ?? undefined,
            body.templateJson ?? undefined,
            body.encodedTemplateYaml ?? undefined,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: DeleteSubscriptionTemplateCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteTemplate(@Param() param: DeleteSubscriptionTemplateParamDto) {
        const result = await this.subscriptionTemplateService.deleteTemplate(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: CreateSubscriptionTemplateCommand,
        httpCode: HttpStatus.CREATED,
        type: CreateSubscriptionTemplateResponseDto,
    })
    async createTemplate(
        @Body() body: CreateSubscriptionTemplateBodyDto,
    ): Promise<CreateSubscriptionTemplateResponseDto> {
        const result = await this.subscriptionTemplateService.createTemplate(
            body.name,
            body.templateType,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: ReorderSubscriptionTemplateCommand,
        httpCode: HttpStatus.OK,
        type: ReorderSubscriptionTemplatesResponseDto,
    })
    async reorderSubscriptionTemplates(
        @Body() body: ReorderSubscriptionTemplatesBodyDto,
    ): Promise<ReorderSubscriptionTemplatesResponseDto> {
        const result = await this.subscriptionTemplateService.reorderSubscriptionTemplates(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

}
