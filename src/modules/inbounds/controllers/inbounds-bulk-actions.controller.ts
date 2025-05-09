import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    AddInboundToNodesCommand,
    AddInboundToUsersCommand,
    RemoveInboundFromNodesCommand,
    RemoveInboundFromUsersCommand,
} from '@libs/contracts/commands';
import { INBOUNDS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    AddInboundToNodesRequestDto,
    AddInboundToNodesResponseDto,
    AddInboundToUsersRequestDto,
    AddInboundToUsersResponseDto,
    RemoveInboundFromNodesRequestDto,
    RemoveInboundFromNodesResponseDto,
    RemoveInboundFromUsersRequestDto,
    RemoveInboundFromUsersResponseDto,
} from '../dtos';
import { BulkOperationResponseModel } from '../models';
import { InboundsService } from '../inbounds.service';

@ApiBearerAuth('Authorization')
@ApiTags('Inbounds Bulk Actions Controller')
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(INBOUNDS_CONTROLLER)
export class InboundsBulkActionsController {
    constructor(private readonly inboundsService: InboundsService) {}

    @ApiOkResponse({
        type: AddInboundToUsersResponseDto,
        description: 'Add inbound to users',
    })
    @Endpoint({
        command: AddInboundToUsersCommand,
        httpCode: HttpStatus.OK,
    })
    async addInboundToUsers(
        @Body() body: AddInboundToUsersRequestDto,
    ): Promise<AddInboundToUsersResponseDto> {
        const result = await this.inboundsService.addInboundToUsers(body.inboundUuid);

        const data = errorHandler(result);
        return {
            response: new BulkOperationResponseModel(data.isSuccess),
        };
    }

    @ApiOkResponse({
        type: RemoveInboundFromUsersResponseDto,
        description: 'Remove inbound from users',
    })
    @Endpoint({
        command: RemoveInboundFromUsersCommand,
        httpCode: HttpStatus.OK,
    })
    async removeInboundFromUsers(
        @Body() body: RemoveInboundFromUsersRequestDto,
    ): Promise<RemoveInboundFromUsersResponseDto> {
        const result = await this.inboundsService.removeInboundFromUsers(body.inboundUuid);

        const data = errorHandler(result);
        return {
            response: new BulkOperationResponseModel(data.isSuccess),
        };
    }

    @ApiOkResponse({
        type: AddInboundToNodesResponseDto,
        description: 'Inbound successfully added to all nodes',
    })
    @Endpoint({
        command: AddInboundToNodesCommand,
        httpCode: HttpStatus.OK,
    })
    async addInboundToNodes(
        @Body() body: AddInboundToNodesRequestDto,
    ): Promise<AddInboundToNodesResponseDto> {
        const result = await this.inboundsService.addInboundToNodes(body.inboundUuid);

        const data = errorHandler(result);
        return {
            response: new BulkOperationResponseModel(data.isSuccess),
        };
    }

    @ApiOkResponse({
        type: RemoveInboundFromNodesResponseDto,
        description: 'Inbound successfully removed from all nodes',
    })
    @Endpoint({
        command: RemoveInboundFromNodesCommand,
        httpCode: HttpStatus.OK,
    })
    async removeInboundFromNodes(
        @Body() body: RemoveInboundFromNodesRequestDto,
    ): Promise<RemoveInboundFromNodesResponseDto> {
        const result = await this.inboundsService.removeInboundFromNodes(body.inboundUuid);

        const data = errorHandler(result);
        return {
            response: new BulkOperationResponseModel(data.isSuccess),
        };
    }
}
