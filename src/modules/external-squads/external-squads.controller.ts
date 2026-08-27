import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONTROLLERS_INFO, EXTERNAL_SQUADS_CONTROLLER } from '@libs/contracts/api';
import {
    AddUsersToExternalSquadCommand,
    CreateExternalSquadCommand,
    DeleteExternalSquadCommand,
    DeleteUsersFromExternalSquadCommand,
    GetExternalSquadByUuidCommand,
    GetExternalSquadsCommand,
    ReorderExternalSquadCommand,
    UpdateExternalSquadCommand,
} from '@libs/contracts/commands';
import {
    GetExternalSquadsTagsCommand,
    SetExternalSquadTagsCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import {
    AddUsersToExternalSquadParamDto,
    CreateExternalSquadBodyDto,
    CreateExternalSquadResponseDto,
    DeleteExternalSquadParamDto,
    GetExternalSquadByUuidParamDto,
    GetExternalSquadByUuidResponseDto,
    GetExternalSquadsResponseDto,
    RemoveUsersFromExternalSquadParamDto,
    ReorderExternalSquadsBodyDto,
    ReorderExternalSquadsResponseDto,
    UpdateExternalSquadBodyDto,
    UpdateExternalSquadResponseDto,
} from './dtos';
import {
    GetExternalSquadsTagsResponseDto,
    SetExternalSquadsTagsBodyDto,
    SetExternalSquadsTagsResponseDto,
} from './dtos';
import { ExternalSquadService } from './external-squads.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.EXTERNAL_SQUADS.resource)
@ApiTags(CONTROLLERS_INFO.EXTERNAL_SQUADS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(EXTERNAL_SQUADS_CONTROLLER)
export class ExternalSquadController {
    constructor(private readonly externalSquadService: ExternalSquadService) {}

    @Endpoint({
        command: GetExternalSquadsTagsCommand,
        httpCode: HttpStatus.OK,
        type: GetExternalSquadsTagsResponseDto,
    })
    async getTags(): Promise<GetExternalSquadsTagsResponseDto> {
        const result = await this.externalSquadService.getTags();

        const data = errorHandler(result);
        return {
            response: { tags: data },
        };
    }

    @Endpoint({
        command: SetExternalSquadTagsCommand,
        httpCode: HttpStatus.OK,
        type: SetExternalSquadsTagsResponseDto,
    })
    async setTags(
        @Body() body: SetExternalSquadsTagsBodyDto,
    ): Promise<SetExternalSquadsTagsResponseDto> {
        const result = await this.externalSquadService.setTags(body.uuid, body.tags);

        const data = errorHandler(result);
        return {
            response: { uuid: body.uuid, tags: data },
        };
    }


    @Endpoint({
        command: GetExternalSquadsCommand,
        httpCode: HttpStatus.OK,
        type: GetExternalSquadsResponseDto,
    })
    async getExternalSquads(): Promise<GetExternalSquadsResponseDto> {
        const result = await this.externalSquadService.getExternalSquads();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: GetExternalSquadByUuidCommand,
        httpCode: HttpStatus.OK,
        type: GetExternalSquadByUuidResponseDto,
    })
    async getExternalSquadByUuid(
        @Param() param: GetExternalSquadByUuidParamDto,
    ): Promise<GetExternalSquadByUuidResponseDto> {
        const result = await this.externalSquadService.getExternalSquadByUuid(param.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'External squad already exists',
    })
    @Endpoint({
        command: CreateExternalSquadCommand,
        httpCode: HttpStatus.CREATED,
        type: CreateExternalSquadResponseDto,
    })
    async createExternalSquad(
        @Body() body: CreateExternalSquadBodyDto,
    ): Promise<CreateExternalSquadResponseDto> {
        const result = await this.externalSquadService.createExternalSquad(body.name);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiConflictResponse({
        description: 'External squad already exists',
    })
    @Endpoint({
        command: UpdateExternalSquadCommand,
        httpCode: HttpStatus.OK,
        type: UpdateExternalSquadResponseDto,
    })
    async updateExternalSquad(
        @Body() body: UpdateExternalSquadBodyDto,
    ): Promise<UpdateExternalSquadResponseDto> {
        const result = await this.externalSquadService.updateExternalSquad(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: DeleteExternalSquadCommand,
        httpCode: HttpStatus.NO_CONTENT,
    })
    async deleteExternalSquad(@Param() param: DeleteExternalSquadParamDto) {
        const result = await this.externalSquadService.deleteExternalSquad(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: AddUsersToExternalSquadCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async addUsersToExternalSquad(@Param() param: AddUsersToExternalSquadParamDto) {
        const result = await this.externalSquadService.addUsersToExternalSquad(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: DeleteUsersFromExternalSquadCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async removeUsersFromExternalSquad(@Param() param: RemoveUsersFromExternalSquadParamDto) {
        const result = await this.externalSquadService.removeUsersFromExternalSquad(param.uuid);

        errorHandler(result);
        return;
    }

    @Endpoint({
        command: ReorderExternalSquadCommand,
        httpCode: HttpStatus.OK,
        type: ReorderExternalSquadsResponseDto,
    })
    async reorderExternalSquads(
        @Body() body: ReorderExternalSquadsBodyDto,
    ): Promise<ReorderExternalSquadsResponseDto> {
        const result = await this.externalSquadService.reorderExternalSquads(body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

}
