import { CONTROLLERS_INFO, NODE_PLUGINS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
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
    CloneNodePluginCommand,
    CreateNodePluginCommand,
    CreateSharedListCommand,
    DeleteNodePluginCommand,
    DeleteSharedListCommand,
    GetNodePluginCommand,
    GetNodePluginsCommand,
    GetSharedListCommand,
    GetSharedListsCommand,
    PluginExecutorCommand,
    ReorderNodePluginCommand,
    SyncNodePluginCommand,
    SyncSharedListCommand,
    UpdateNodePluginCommand,
    UpdateSharedListCommand,
} from '@libs/contracts/commands';
import { GetNodePluginsTagsCommand, SetNodePluginTagsCommand } from '@libs/contracts/commands';

import {
    GetNodePluginsTagsResponseDto,
    SetNodePluginsTagsBodyDto,
    SetNodePluginsTagsResponseDto,
} from './dtos';
import {
    ReorderNodePluginsBodyDto,
    ReorderNodePluginsResponseDto,
    GetNodePluginsResponseDto,
    GetNodePluginResponseDto,
    UpdateNodePluginBodyDto,
    UpdateNodePluginResponseDto,
    DeleteNodePluginParamDto,
    CreateNodePluginBodyDto,
    CreateNodePluginResponseDto,
    CloneNodePluginResponseDto,
    CloneNodePluginBodyDto,
    PluginExecutorBodyDto,
    GetNodePluginParamDto,
    SyncNodePluginBodyDto,
} from './dtos/node-plugins.dtos';
import {
    CreateSharedListBodyDto,
    CreateSharedListResponseDto,
    DeleteSharedListBodyDto,
    GetSharedListQueryDto,
    GetSharedListResponseDto,
    GetSharedListsResponseDto,
    SyncSharedListBodyDto,
    UpdateSharedListBodyDto,
    UpdateSharedListResponseDto,
} from './dtos/shared-lists.dtos';
import { NodePluginService } from './node-plugins.service';
import { SharedListsService } from './shared-lists.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.NODE_PLUGINS.resource)
@ApiTags(CONTROLLERS_INFO.NODE_PLUGINS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODE_PLUGINS_CONTROLLER)
export class NodePluginController {
    constructor(
        private readonly nodePluginService: NodePluginService,
        private readonly sharedListsService: SharedListsService,
    ) {}

    @Endpoint({
        command: GetNodePluginsTagsCommand,
        httpCode: HttpStatus.OK,
        type: GetNodePluginsTagsResponseDto,
    })
    async getTags(): Promise<GetNodePluginsTagsResponseDto> {
        const result = await this.nodePluginService.getTags();

        const data = errorHandler(result);
        return {
            response: { tags: data },
        };
    }

    @Endpoint({
        command: SetNodePluginTagsCommand,
        httpCode: HttpStatus.OK,
        type: SetNodePluginsTagsResponseDto,
    })
    async setTags(@Body() body: SetNodePluginsTagsBodyDto): Promise<SetNodePluginsTagsResponseDto> {
        const result = await this.nodePluginService.setTags(body.uuid, body.tags);

        const data = errorHandler(result);
        return {
            response: { uuid: body.uuid, tags: data },
        };
    }


    @Endpoint({
        type: GetSharedListsResponseDto,
        command: GetSharedListsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllSharedLists(): Promise<GetSharedListsResponseDto> {
        const result = await this.sharedListsService.getAllSharedLists();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: GetSharedListResponseDto,
        command: GetSharedListCommand,
        httpCode: HttpStatus.OK,
    })
    async getSharedListByName(
        @Query() query: GetSharedListQueryDto,
    ): Promise<GetSharedListResponseDto> {
        const result = await this.sharedListsService.getSharedListByName(query.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: CreateSharedListResponseDto,
        command: CreateSharedListCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createSharedList(
        @Body() body: CreateSharedListBodyDto,
    ): Promise<CreateSharedListResponseDto> {
        const result = await this.sharedListsService.createSharedList(body.name, body.config);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: UpdateSharedListResponseDto,
        command: UpdateSharedListCommand,
        httpCode: HttpStatus.OK,
    })
    async updateSharedList(
        @Body() body: UpdateSharedListBodyDto,
    ): Promise<UpdateSharedListResponseDto> {
        const result = await this.sharedListsService.updateSharedList(body.name, body.config);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: SyncSharedListCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async syncSharedList(@Body() body: SyncSharedListBodyDto) {
        const result = await this.sharedListsService.syncSharedList(body.name);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: DeleteSharedListCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteSharedList(@Body() body: DeleteSharedListBodyDto) {
        const result = await this.sharedListsService.deleteSharedListByName(body.name);

        errorHandler(result);
        return;
    }

    @Endpoint({
        type: GetNodePluginsResponseDto,
        command: GetNodePluginsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllConfigs(): Promise<GetNodePluginsResponseDto> {
        const result = await this.nodePluginService.getAllConfigs();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: GetNodePluginResponseDto,
        command: GetNodePluginCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfigByUuid(
        @Param() param: GetNodePluginParamDto,
    ): Promise<GetNodePluginResponseDto> {
        const { uuid } = param;
        const result = await this.nodePluginService.getConfigByUuid(uuid);
        const data = errorHandler(result);
        return {
            response: {
                ...data,
                pluginConfig: data.pluginConfig!,
            },
        };
    }

    @Endpoint({
        type: UpdateNodePluginResponseDto,
        command: UpdateNodePluginCommand,
        httpCode: HttpStatus.OK,
    })
    async updateConfig(
        @Body() body: UpdateNodePluginBodyDto,
    ): Promise<UpdateNodePluginResponseDto> {
        const result = await this.nodePluginService.updateConfig(
            body.uuid,
            body.name?.trim() ?? undefined,
            body.pluginConfig ?? undefined,
        );

        const data = errorHandler(result);
        return {
            response: {
                ...data,
                pluginConfig: data.pluginConfig!,
            },
        };
    }

    @Endpoint({
        command: DeleteNodePluginCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteConfig(@Param() param: DeleteNodePluginParamDto) {
        const result = await this.nodePluginService.deleteConfig(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        type: CreateNodePluginResponseDto,
        command: CreateNodePluginCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createConfig(
        @Body() body: CreateNodePluginBodyDto,
    ): Promise<CreateNodePluginResponseDto> {
        const result = await this.nodePluginService.createConfig(body.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: ReorderNodePluginsResponseDto,
        command: ReorderNodePluginCommand,
        httpCode: HttpStatus.OK,
    })
    async reorderNodePlugins(
        @Body() body: ReorderNodePluginsBodyDto,
    ): Promise<ReorderNodePluginsResponseDto> {
        const result = await this.nodePluginService.reorderNodePlugins(body.items);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: CloneNodePluginResponseDto,
        command: CloneNodePluginCommand,
        httpCode: HttpStatus.OK,
    })
    async cloneNodePlugin(
        @Body() body: CloneNodePluginBodyDto,
    ): Promise<CloneNodePluginResponseDto> {
        const result = await this.nodePluginService.cloneNodePlugin(body.cloneFromUuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: SyncNodePluginCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async syncNodePlugin(@Body() body: SyncNodePluginBodyDto) {
        const result = await this.nodePluginService.syncNodePluginByUuid(body.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: PluginExecutorCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async pluginExecutor(@Body() body: PluginExecutorBodyDto) {
        const result = await this.nodePluginService.executePluginCommand(body);

        errorHandler(result);
        return;
    }

}
