import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    DropConnectionsCommand,
    FetchIpsCommand,
    FetchIpsResultCommand,
    FetchUsersIpsCommand,
    FetchUsersIpsResultCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, IP_CONTROL_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    FetchIpsRequestDto,
    FetchIpsResponseDto,
    FetchIpsResultRequestDto,
    FetchIpsResultResponseDto,
    DropConnectionsRequestDto,
    DropConnectionsResponseDto,
    FetchUsersIpsResponseDto,
    FetchUsersIpsRequestDto,
    FetchUsersIpsResultRequestDto,
    FetchUsersIpsResultResponseDto,
} from './dtos';
import { IpControlService } from './ip-control.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.IP_CONTROL.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(IP_CONTROL_CONTROLLER)
export class IpControlController {
    constructor(private readonly ipControlService: IpControlService) {}

    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiOkResponse({
        type: FetchIpsResponseDto,
        description: 'Return jobId for further processing',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: FetchIpsCommand,
        httpCode: HttpStatus.CREATED,
    })
    async fetchUserIps(@Param() paramData: FetchIpsRequestDto): Promise<FetchIpsResponseDto> {
        const result = await this.ipControlService.fetchUserIps(paramData.uuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Job not found',
    })
    @ApiOkResponse({
        type: FetchIpsResultResponseDto,
        description: 'Return result or status of the job',
    })
    @ApiParam({ name: 'jobId', type: String, description: 'Job ID', required: true })
    @Endpoint({
        command: FetchIpsResultCommand,
        httpCode: HttpStatus.OK,
    })
    async getFetchIpsResult(
        @Param() paramData: FetchIpsResultRequestDto,
    ): Promise<FetchIpsResultResponseDto> {
        const result = await this.ipControlService.getFetchIpsResult(paramData.jobId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'User not found // Connected nodes not found',
    })
    @ApiOkResponse({
        type: DropConnectionsResponseDto,
        description: 'Event sent to background executor',
    })
    @Endpoint({
        command: DropConnectionsCommand,
        httpCode: HttpStatus.OK,
        apiBody: DropConnectionsRequestDto,
    })
    async dropConnections(
        @Body() bodyData: DropConnectionsRequestDto,
    ): Promise<DropConnectionsResponseDto> {
        const result = await this.ipControlService.dropConnections(bodyData);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Node not found',
    })
    @ApiOkResponse({
        type: FetchUsersIpsResponseDto,
        description: 'Return jobId for further processing',
    })
    @ApiParam({ name: 'nodeUuid', type: String, description: 'UUID of the node', required: true })
    @Endpoint({
        command: FetchUsersIpsCommand,
        httpCode: HttpStatus.CREATED,
    })
    async fetchUsersIps(
        @Param() paramData: FetchUsersIpsRequestDto,
    ): Promise<FetchUsersIpsResponseDto> {
        const result = await this.ipControlService.fetchUsersIps(paramData.nodeUuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'Job not found',
    })
    @ApiOkResponse({
        type: FetchUsersIpsResultResponseDto,
        description: 'Return result or status of the job',
    })
    @ApiParam({ name: 'jobId', type: String, description: 'Job ID', required: true })
    @Endpoint({
        command: FetchUsersIpsResultCommand,
        httpCode: HttpStatus.OK,
    })
    async getFetchUsersIpsResult(
        @Param() paramData: FetchUsersIpsResultRequestDto,
    ): Promise<FetchUsersIpsResultResponseDto> {
        const result = await this.ipControlService.getFetchUsersIpsResult(paramData.jobId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
