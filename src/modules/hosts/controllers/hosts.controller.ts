import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNotFoundResponse,
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
    CreateHostCommand,
    DeleteHostCommand,
    GetAllHostsCommand,
    GetAllHostTagsCommand,
    GetOneHostCommand,
    ReorderHostCommand,
    UpdateHostCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, HOSTS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    ReorderHostRequestDto,
    ReorderHostResponseDto,
    GetAllHostTagsResponseDto,
    CreateHostResponseDto,
    CreateHostRequestDto,
    DeleteHostRequestDto,
    DeleteHostResponseDto,
    GetAllHostsResponseDto,
    UpdateHostResponseDto,
    UpdateHostRequestDto,
    GetOneHostResponseDto,
    GetOneHostRequestDto,
} from '../dtos';
import { GetAllHostTagsResponseModel, HostResponseModel } from '../models';
import { HostsService } from '../hosts.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.HOSTS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(HOSTS_CONTROLLER)
export class HostsController {
    constructor(private readonly hostsService: HostsService) {}

    @ApiOkResponse({
        type: GetAllHostTagsResponseDto,
        description: 'Host tags fetched successfully',
    })
    @Endpoint({
        command: GetAllHostTagsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllHostTags(): Promise<GetAllHostTagsResponseDto> {
        const result = await this.hostsService.getAllHostTags();

        const data = errorHandler(result);
        return {
            response: new GetAllHostTagsResponseModel(data),
        };
    }

    @ApiCreatedResponse({
        type: CreateHostResponseDto,
        description: 'Host created successfully',
    })
    @Endpoint({
        command: CreateHostCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: CreateHostRequestDto,
    })
    async createHost(@Body() body: CreateHostRequestDto): Promise<CreateHostResponseDto> {
        const result = await this.hostsService.createHost(body);

        const data = errorHandler(result);
        return {
            response: new HostResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: UpdateHostResponseDto,
        description: 'Host updated successfully',
    })
    @Endpoint({
        command: UpdateHostCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateHostRequestDto,
    })
    async updateHost(@Body() body: UpdateHostRequestDto): Promise<UpdateHostResponseDto> {
        const result = await this.hostsService.updateHost(body);

        const data = errorHandler(result);
        return {
            response: new HostResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: GetAllHostsResponseDto,
        description: 'Hosts fetched successfully',
    })
    @Endpoint({
        command: GetAllHostsCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllHosts(): Promise<GetAllHostsResponseDto> {
        const result = await this.hostsService.getAllHosts();

        const data = errorHandler(result);
        return {
            response: data.map((host) => new HostResponseModel(host)),
        };
    }

    @ApiOkResponse({
        type: GetOneHostResponseDto,
        description: 'Host fetched successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the host', required: true })
    @Endpoint({
        command: GetOneHostCommand,
        httpCode: HttpStatus.OK,
    })
    async getOneHost(@Param() paramData: GetOneHostRequestDto): Promise<GetOneHostResponseDto> {
        const result = await this.hostsService.getOneHost(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: new HostResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: ReorderHostResponseDto,
        description: 'Hosts reordered successfully',
    })
    @Endpoint({
        command: ReorderHostCommand,
        httpCode: HttpStatus.OK,
        apiBody: ReorderHostRequestDto,
    })
    async reorderHosts(@Body() body: ReorderHostRequestDto): Promise<ReorderHostResponseDto> {
        const result = await this.hostsService.reorderHosts(body);

        const data = errorHandler(result);
        return {
            response: {
                isUpdated: data.isUpdated,
            },
        };
    }

    @ApiNotFoundResponse({
        description: 'Host not found',
    })
    @ApiOkResponse({
        type: DeleteHostResponseDto,
        description: 'Host deleted successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the host', required: true })
    @Endpoint({
        command: DeleteHostCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteHost(@Param() paramData: DeleteHostRequestDto): Promise<DeleteHostResponseDto> {
        const result = await this.hostsService.deleteHost(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
