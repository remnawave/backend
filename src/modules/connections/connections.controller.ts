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
import { CONTROLLERS_INFO, CONNECTIONS_CONTROLLER } from '@libs/contracts/api';
import {
    DropConnectionsCommand,
    ConnectionsByUserCommand,
    ConnectionsByUserResultCommand,
    ConnectionsByNodeCommand,
    ConnectionsByNodeResultCommand,
    GeocheckByNodeCommand,
    GeocheckByNodeResultCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { ConnectionsService } from './connections.service';
import {
    ConnectionsByUserBodyParamDto,
    ConnectionsByUserResponseDto,
    ConnectionsByUserResultParamDto,
    ConnectionsByUserResultResponseDto,
    DropConnectionsBodyDto,
    ConnectionsByNodeParamDto,
    ConnectionsByNodeResponseDto,
    ConnectionsByNodeResultParamDto,
    ConnectionsByNodeResultResponseDto,
    GeocheckByNodeBodyDto,
    GeocheckByNodeParamDto,
    GeocheckByNodeResponseDto,
    GeocheckByNodeResultParamDto,
    GeocheckByNodeResultResponseDto,
} from './dtos';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.CONNECTIONS.resource)
@ApiTags(CONTROLLERS_INFO.CONNECTIONS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(CONNECTIONS_CONTROLLER)
export class ConnectionsController {
    constructor(private readonly connectionsService: ConnectionsService) {}

    @Endpoint({
        type: ConnectionsByUserResponseDto,
        command: ConnectionsByUserCommand,
        httpCode: HttpStatus.CREATED,
    })
    async connectionsByUser(
        @Param() param: ConnectionsByUserBodyParamDto,
    ): Promise<ConnectionsByUserResponseDto> {
        const result = await this.connectionsService.connectionsByUser(param.userId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: ConnectionsByUserResultResponseDto,
        command: ConnectionsByUserResultCommand,
        httpCode: HttpStatus.OK,
    })
    async connectionsByUserResult(
        @Param() param: ConnectionsByUserResultParamDto,
    ): Promise<ConnectionsByUserResultResponseDto> {
        const result = await this.connectionsService.connectionsByUserResult(param.jobId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        command: DropConnectionsCommand,
        httpCode: HttpStatus.ACCEPTED,
    })
    async dropConnections(@Body() body: DropConnectionsBodyDto) {
        const result = await this.connectionsService.dropConnections(body);

        errorHandler(result);
        return;
    }

    @Endpoint({
        type: ConnectionsByNodeResponseDto,
        command: ConnectionsByNodeCommand,
        httpCode: HttpStatus.CREATED,
    })
    async connectionsByNode(
        @Param() param: ConnectionsByNodeParamDto,
    ): Promise<ConnectionsByNodeResponseDto> {
        const result = await this.connectionsService.connectionsByNode(param.nodeUuid);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: ConnectionsByNodeResultResponseDto,
        command: ConnectionsByNodeResultCommand,
        httpCode: HttpStatus.OK,
    })
    async connectionsByNodeResult(
        @Param() param: ConnectionsByNodeResultParamDto,
    ): Promise<ConnectionsByNodeResultResponseDto> {
        const result = await this.connectionsService.connectionsByNodeResult(param.jobId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: GeocheckByNodeResponseDto,
        command: GeocheckByNodeCommand,
        httpCode: HttpStatus.CREATED,
    })
    async geocheckByNode(
        @Param() param: GeocheckByNodeParamDto,
        @Body() body: GeocheckByNodeBodyDto,
    ): Promise<GeocheckByNodeResponseDto> {
        const result = await this.connectionsService.geocheckByNode(param.nodeUuid, body);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @Endpoint({
        type: GeocheckByNodeResultResponseDto,
        command: GeocheckByNodeResultCommand,
        httpCode: HttpStatus.OK,
    })
    async geocheckByNodeResult(
        @Param() param: GeocheckByNodeResultParamDto,
    ): Promise<GeocheckByNodeResultResponseDto> {
        const result = await this.connectionsService.geocheckByNodeResult(param.jobId);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
