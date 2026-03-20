import { CONTROLLERS_INFO, NODE_PLUGINS_CONTROLLER } from '@contract/api';
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
    CloneNodePluginCommand,
    CreateNodePluginCommand,
    DeleteNodePluginCommand,
    GetNodePluginCommand,
    GetNodePluginsCommand,
    PluginExecutorCommand,
    ReorderNodePluginCommand,
    UpdateNodePluginCommand,
} from '@libs/contracts/commands';

import {
    ReorderNodePluginsRequestDto,
    ReorderNodePluginsResponseDto,
    GetNodePluginsResponseDto,
    GetNodePluginResponseDto,
    UpdateNodePluginRequestDto,
    UpdateNodePluginResponseDto,
    DeleteNodePluginRequestDto,
    DeleteNodePluginResponseDto,
    CreateNodePluginRequestDto,
    CreateNodePluginResponseDto,
    GetNodePluginRequestDto,
    CloneNodePluginResponseDto,
    CloneNodePluginRequestDto,
    PluginExecutorResponseDto,
    PluginExecutorRequestDto,
} from './dtos/node-plugins.dtos';
import { NodePluginService } from './node-plugins.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.NODE_PLUGINS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODE_PLUGINS_CONTROLLER)
export class NodePluginController {
    constructor(private readonly nodePluginService: NodePluginService) {}

    @ApiOkResponse({
        type: GetNodePluginsResponseDto,
        description: 'Node plugins retrieved successfully',
    })
    @Endpoint({
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

    @ApiOkResponse({
        type: GetNodePluginResponseDto,
        description: 'Node plugin retrieved successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node plugin UUID' })
    @Endpoint({
        command: GetNodePluginCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfigByUuid(
        @Param() paramData: GetNodePluginRequestDto,
    ): Promise<GetNodePluginResponseDto> {
        const { uuid } = paramData;
        const result = await this.nodePluginService.getConfigByUuid(uuid);
        const data = errorHandler(result);
        return {
            response: {
                ...data,
                pluginConfig: data.pluginConfig!,
            },
        };
    }

    @ApiOkResponse({
        type: UpdateNodePluginResponseDto,
        description: 'Node plugin updated successfully',
    })
    @Endpoint({
        command: UpdateNodePluginCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateNodePluginRequestDto,
    })
    async updateConfig(
        @Body() body: UpdateNodePluginRequestDto,
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

    @ApiOkResponse({
        type: DeleteNodePluginResponseDto,
        description: 'Node plugin deleted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node plugin UUID' })
    @Endpoint({
        command: DeleteNodePluginCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteConfig(
        @Param() paramData: DeleteNodePluginRequestDto,
    ): Promise<DeleteNodePluginResponseDto> {
        const result = await this.nodePluginService.deleteConfig(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: CreateNodePluginResponseDto,
        description: 'Node plugin created successfully',
    })
    @Endpoint({
        command: CreateNodePluginCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateNodePluginRequestDto,
    })
    async createConfig(
        @Body() body: CreateNodePluginRequestDto,
    ): Promise<CreateNodePluginResponseDto> {
        const result = await this.nodePluginService.createConfig(body.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: ReorderNodePluginsResponseDto,
        description: 'Node plugins reordered successfully',
    })
    @Endpoint({
        command: ReorderNodePluginCommand,
        httpCode: HttpStatus.OK,
        apiBody: ReorderNodePluginsRequestDto,
    })
    async reorderNodePlugins(
        @Body() body: ReorderNodePluginsRequestDto,
    ): Promise<ReorderNodePluginsResponseDto> {
        const result = await this.nodePluginService.reorderNodePlugins(body.items);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: CloneNodePluginResponseDto,
        description: 'Node plugin cloned successfully',
    })
    @Endpoint({
        command: CloneNodePluginCommand,
        httpCode: HttpStatus.OK,
        apiBody: CloneNodePluginRequestDto,
    })
    async cloneNodePlugin(
        @Body() body: CloneNodePluginRequestDto,
    ): Promise<CloneNodePluginResponseDto> {
        const result = await this.nodePluginService.cloneNodePlugin(body.cloneFromUuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: PluginExecutorResponseDto,
        description: 'Node plugin cloned successfully',
    })
    @Endpoint({
        command: PluginExecutorCommand,
        httpCode: HttpStatus.OK,
        apiBody: PluginExecutorRequestDto,
    })
    async pluginExecutor(
        @Body() body: PluginExecutorRequestDto,
    ): Promise<PluginExecutorResponseDto> {
        const result = await this.nodePluginService.executePluginCommand(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
