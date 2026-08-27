import { Body, Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONTROLLERS_INFO, INTERNAL_SQUADS_CONTROLLER } from '@libs/contracts/api';
import {
    AddManyUsersToInternalSquadCommand,
    AddUsersToInternalSquadCommand,
    CreateInternalSquadCommand,
    DeleteInternalSquadCommand,
    DeleteManyUsersFromInternalSquadCommand,
    DeleteUsersFromInternalSquadCommand,
    GetInternalSquadAccessibleNodesCommand,
    GetInternalSquadCommand,
    GetInternalSquadsCommand,
    GetInternalSquadUsageCommand,
    ReorderInternalSquadCommand,
    UpdateInternalSquadCommand,
} from '@libs/contracts/commands';
import {
    GetInternalSquadsTagsCommand,
    SetInternalSquadTagsCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import {
    AddUsersToInternalSquadParamDto,
    CreateInternalSquadBodyDto,
    CreateInternalSquadResponseDto,
    DeleteInternalSquadParamDto,
    GetInternalSquadAccessibleNodesParamDto,
    GetInternalSquadAccessibleNodesResponseDto,
    GetInternalSquadUsageParamDto,
    GetInternalSquadUsageQueryDto,
    GetInternalSquadUsageResponseDto,
    GetInternalSquadParamDto,
    GetInternalSquadResponseDto,
    GetInternalSquadsResponseDto,
    RemoveUsersFromInternalSquadParamDto,
    ReorderInternalSquadsBodyDto,
    ReorderInternalSquadsResponseDto,
    UpdateInternalSquadBodyDto,
    UpdateInternalSquadResponseDto,
    DeleteManyUsersFromInternalSquadBodyDto,
    AddManyUsersToInternalSquadBodyDto,
    AddManyUsersToInternalSquadParamDto,
    DeleteManyUsersFromInternalSquadParamDto,
} from './dtos';
import {
    GetInternalSquadsTagsResponseDto,
    SetInternalSquadsTagsBodyDto,
    SetInternalSquadsTagsResponseDto,
} from './dtos';
import { InternalSquadService } from './internal-squad.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.INTERNAL_SQUADS.resource)
@ApiTags(CONTROLLERS_INFO.INTERNAL_SQUADS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(INTERNAL_SQUADS_CONTROLLER)
export class InternalSquadController {
    constructor(private readonly internalSquadService: InternalSquadService) {}

    @Endpoint({
        command: GetInternalSquadsTagsCommand,
        httpCode: HttpStatus.OK,
        type: GetInternalSquadsTagsResponseDto,
    })
    async getTags(): Promise<GetInternalSquadsTagsResponseDto> {
        const result = await this.internalSquadService.getTags();

        const data = errorHandler(result);
        return {
            response: { tags: data },
        };
    }

    @Endpoint({
        command: SetInternalSquadTagsCommand,
        httpCode: HttpStatus.OK,
        type: SetInternalSquadsTagsResponseDto,
    })
    async setTags(
        @Body() body: SetInternalSquadsTagsBodyDto,
    ): Promise<SetInternalSquadsTagsResponseDto> {
        const result = await this.internalSquadService.setTags(body.uuid, body.tags);

        const data = errorHandler(result);
        return {
            response: { uuid: body.uuid, tags: data },
        };
    }


    @Endpoint({
        command: GetInternalSquadsCommand,
        httpCode: HttpStatus.OK,
        type: GetInternalSquadsResponseDto,
    })
    async getInternalSquads(): Promise<GetInternalSquadsResponseDto> {
        const result = await this.internalSquadService.getInternalSquads();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetInternalSquadCommand,
        httpCode: HttpStatus.OK,
        type: GetInternalSquadResponseDto,
    })
    async getInternalSquadByUuid(
        @Param() param: GetInternalSquadParamDto,
    ): Promise<GetInternalSquadResponseDto> {
        const result = await this.internalSquadService.getInternalSquadByUuid(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'Internal squad already exists',
    })
    @Endpoint({
        command: CreateInternalSquadCommand,
        httpCode: HttpStatus.CREATED,
        type: CreateInternalSquadResponseDto,
    })
    async createInternalSquad(
        @Body() createInternalSquadDto: CreateInternalSquadBodyDto,
    ): Promise<CreateInternalSquadResponseDto> {
        const result = await this.internalSquadService.createInternalSquad(
            createInternalSquadDto.name,
            createInternalSquadDto.inbounds,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetInternalSquadAccessibleNodesCommand,
        httpCode: HttpStatus.OK,
        type: GetInternalSquadAccessibleNodesResponseDto,
    })
    async getInternalSquadAccessibleNodes(
        @Param() param: GetInternalSquadAccessibleNodesParamDto,
    ): Promise<GetInternalSquadAccessibleNodesResponseDto> {
        const result = await this.internalSquadService.getInternalSquadAccessibleNodes(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetInternalSquadUsageCommand,
        httpCode: HttpStatus.OK,
        type: GetInternalSquadUsageResponseDto,
    })
    async getInternalSquadUsage(
        @Param() param: GetInternalSquadUsageParamDto,
        @Query() query: GetInternalSquadUsageQueryDto,
    ): Promise<GetInternalSquadUsageResponseDto> {
        const result = await this.internalSquadService.getSquadUsage(param.uuid, query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'Internal squad already exists',
    })
    @Endpoint({
        command: UpdateInternalSquadCommand,
        httpCode: HttpStatus.OK,
        type: UpdateInternalSquadResponseDto,
    })
    async updateInternalSquad(
        @Body() body: UpdateInternalSquadBodyDto,
    ): Promise<UpdateInternalSquadResponseDto> {
        const result = await this.internalSquadService.updateInternalSquad(
            body.uuid,
            body.name,
            body.inbounds,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: DeleteInternalSquadCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteInternalSquad(@Param() param: DeleteInternalSquadParamDto) {
        const result = await this.internalSquadService.deleteInternalSquad(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: AddUsersToInternalSquadCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async addUsersToInternalSquad(@Param() param: AddUsersToInternalSquadParamDto) {
        const result = await this.internalSquadService.addUsersToInternalSquad(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: DeleteUsersFromInternalSquadCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async removeUsersFromInternalSquad(@Param() param: RemoveUsersFromInternalSquadParamDto) {
        const result = await this.internalSquadService.removeUsersFromInternalSquad(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: ReorderInternalSquadCommand,
        httpCode: HttpStatus.OK,
        type: ReorderInternalSquadsResponseDto,
    })
    async reorderInternalSquads(
        @Body() body: ReorderInternalSquadsBodyDto,
    ): Promise<ReorderInternalSquadsResponseDto> {
        const result = await this.internalSquadService.reorderInternalSquads(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: AddManyUsersToInternalSquadCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async addManyUsersToInternalSquad(
        @Param() param: AddManyUsersToInternalSquadParamDto,
        @Body() body: AddManyUsersToInternalSquadBodyDto,
    ) {
        const result = await this.internalSquadService.addManyUsersToInternalSquad(
            param.uuid,
            body.userIds,
        );

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: DeleteManyUsersFromInternalSquadCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async removeManyUsersFromInternalSquad(
        @Param() param: DeleteManyUsersFromInternalSquadParamDto,
        @Body() body: DeleteManyUsersFromInternalSquadBodyDto,
    ) {
        const result = await this.internalSquadService.removeManyUsersFromInternalSquad(
            param.uuid,
            body.userIds,
        );

        errorHandler(result);
        return;
    }

}
