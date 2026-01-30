import { CONTROLLERS_INFO, NODES_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { RolesGuard } from '@common/guards/roles/roles.guard';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import {
    CreateNodeCommand,
    DeleteNodeCommand,
    DisableNodeCommand,
    EnableNodeCommand,
    GetAllNodesCommand,
    GetAllNodesTagsCommand,
    GetOneNodeCommand,
    BulkNodesProfileModificationCommand,
    ReorderNodeCommand,
    ResetNodeTrafficCommand,
    RestartAllNodesCommand,
    RestartNodeCommand,
    UpdateNodeCommand,
    BulkNodesActionsCommand,
} from '@libs/contracts/commands';

import {
    BulkNodesActionsRequestDto,
    BulkNodesActionsResponseDto,
    CreateNodeRequestDto,
    CreateNodeResponseDto,
    DeleteNodeRequestParamDto,
    DeleteNodeResponseDto,
    DisableNodeRequestParamDto,
    DisableNodeResponseDto,
    EnableNodeResponseDto,
    GetAllNodesResponseDto,
    GetAllNodesTagsResponseDto,
    GetOneNodeRequestParamDto,
    GetOneNodeResponseDto,
    ProfileModificationRequestDto,
    ProfileModificationResponseDto,
    ReorderNodeRequestDto,
    ReorderNodeResponseDto,
    ResetNodeTrafficRequestDto,
    ResetNodeTrafficResponseDto,
    RestartAllNodesRequestBodyDto,
    RestartAllNodesResponseDto,
    RestartNodeRequestDto,
    RestartNodeResponseDto,
    UpdateNodeRequestDto,
    UpdateNodeResponseDto,
} from './dtos';
import {
    CreateNodeResponseModel,
    GetAllNodesResponseModel,
    GetAllNodesTagsResponseModel,
    GetOneNodeResponseModel,
} from './models';
import { EnableNodeRequestParamDto } from './dtos';
import { NodesService } from './nodes.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.NODES.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(NODES_CONTROLLER)
export class NodesController {
    constructor(private readonly nodesService: NodesService) {}

    @ApiOkResponse({
        type: GetAllNodesTagsResponseDto,
        description: 'Nodes tags fetched',
    })
    @Endpoint({
        command: GetAllNodesTagsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllNodesTags(): Promise<GetAllNodesTagsResponseDto> {
        const res = await this.nodesService.getAllNodesTags();
        const data = errorHandler(res);
        return {
            response: new GetAllNodesTagsResponseModel(data),
        };
    }

    @ApiCreatedResponse({
        type: CreateNodeResponseDto,
        description: 'Node created successfully',
    })
    @Endpoint({
        command: CreateNodeCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateNodeRequestDto,
    })
    async createNode(@Body() body: CreateNodeRequestDto): Promise<CreateNodeResponseDto> {
        const result = await this.nodesService.createNode(body);

        const data = errorHandler(result);
        return {
            response: new CreateNodeResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: GetAllNodesResponseDto,
        description: 'Nodes fetched',
    })
    @Endpoint({
        command: GetAllNodesCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllNodes(): Promise<GetAllNodesResponseDto> {
        const res = await this.nodesService.getAllNodes();
        const data = errorHandler(res);
        return {
            response: data.map((node) => new GetAllNodesResponseModel(node)),
        };
    }

    @ApiOkResponse({
        type: GetOneNodeResponseDto,
        description: 'Node fetched',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node UUID' })
    @Endpoint({
        command: GetOneNodeCommand,
        httpCode: HttpStatus.OK,
    })
    async getOneNode(@Param() uuid: GetOneNodeRequestParamDto): Promise<GetOneNodeResponseDto> {
        const res = await this.nodesService.getOneNode(uuid.uuid);
        const data = errorHandler(res);
        return {
            response: new GetOneNodeResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: EnableNodeResponseDto,
        description: 'Node enabled',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node UUID' })
    @Endpoint({
        command: EnableNodeCommand,
        httpCode: HttpStatus.OK,
    })
    async enableNode(@Param() uuid: EnableNodeRequestParamDto): Promise<EnableNodeResponseDto> {
        const res = await this.nodesService.enableNode(uuid.uuid);
        const data = errorHandler(res);
        return {
            response: new GetOneNodeResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: DisableNodeResponseDto,
        description: 'Node disabled',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node UUID' })
    @Endpoint({
        command: DisableNodeCommand,
        httpCode: HttpStatus.OK,
    })
    async disableNode(@Param() uuid: DisableNodeRequestParamDto): Promise<DisableNodeResponseDto> {
        const res = await this.nodesService.disableNode(uuid.uuid);
        const data = errorHandler(res);
        return {
            response: new GetOneNodeResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: DeleteNodeResponseDto,
        description: 'Node deleted',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node UUID' })
    @Endpoint({
        command: DeleteNodeCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteNode(@Param() uuid: DeleteNodeRequestParamDto): Promise<DeleteNodeResponseDto> {
        const res = await this.nodesService.deleteNode(uuid.uuid);
        const data = errorHandler(res);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: UpdateNodeResponseDto,
        description: 'Node updated',
    })
    @Endpoint({
        command: UpdateNodeCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateNodeRequestDto,
    })
    async updateNode(@Body() body: UpdateNodeRequestDto): Promise<UpdateNodeResponseDto> {
        const res = await this.nodesService.updateNode(body);
        const data = errorHandler(res);
        return {
            response: new GetOneNodeResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: RestartNodeResponseDto,
        description: 'Node restarted',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node UUID' })
    @Endpoint({
        command: RestartNodeCommand,
        httpCode: HttpStatus.OK,
    })
    async restartNode(@Param() uuid: RestartNodeRequestDto): Promise<RestartNodeResponseDto> {
        const res = await this.nodesService.restartNode(uuid.uuid);
        const data = errorHandler(res);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: ResetNodeTrafficResponseDto,
        description: 'Event sent',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'Node UUID' })
    @Endpoint({
        command: ResetNodeTrafficCommand,
        httpCode: HttpStatus.OK,
    })
    async resetNodeTraffic(
        @Param() uuid: ResetNodeTrafficRequestDto,
    ): Promise<ResetNodeTrafficResponseDto> {
        const res = await this.nodesService.resetNodeTraffic(uuid.uuid);
        const data = errorHandler(res);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: RestartAllNodesResponseDto,
        description: 'All nodes restarted',
    })
    @Endpoint({
        command: RestartAllNodesCommand,
        httpCode: HttpStatus.OK,
    })
    async restartAllNodes(
        @Body() { forceRestart }: RestartAllNodesRequestBodyDto,
    ): Promise<RestartAllNodesResponseDto> {
        const res = await this.nodesService.restartAllNodes(forceRestart);
        const data = errorHandler(res);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: ReorderNodeResponseDto,
        description: 'Nodes reordered successfully',
    })
    @Endpoint({
        command: ReorderNodeCommand,
        httpCode: HttpStatus.OK,
        apiBody: ReorderNodeRequestDto,
    })
    async reorderNodes(@Body() body: ReorderNodeRequestDto): Promise<ReorderNodeResponseDto> {
        const result = await this.nodesService.reorderNodes(body);

        const data = errorHandler(result);
        return {
            response: data.map((node) => new GetAllNodesResponseModel(node)),
        };
    }

    @ApiOkResponse({
        type: ProfileModificationResponseDto,
        description: 'Event sent successfully',
    })
    @Endpoint({
        command: BulkNodesProfileModificationCommand,
        httpCode: HttpStatus.OK,
        apiBody: ProfileModificationRequestDto,
    })
    async profileModification(
        @Body() body: ProfileModificationRequestDto,
    ): Promise<ProfileModificationResponseDto> {
        const result = await this.nodesService.profileModification(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: BulkNodesActionsResponseDto,
        description: 'Event sent successfully',
    })
    @Endpoint({
        command: BulkNodesActionsCommand,
        httpCode: HttpStatus.OK,
        apiBody: BulkNodesActionsRequestDto,
    })
    async bulkNodesActions(
        @Body() body: BulkNodesActionsRequestDto,
    ): Promise<BulkNodesActionsResponseDto> {
        const result = await this.nodesService.bulkNodesActions(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
