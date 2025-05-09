import { Body, Controller, HttpStatus, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { Endpoint } from '@common/decorators/base-endpoint';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateUserHwidDeviceCommand,
    DeleteUserHwidDeviceCommand,
    GetUserHwidDevicesCommand,
} from '@libs/contracts/commands';
import { HWID_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateUserHwidDeviceRequestDto,
    CreateUserHwidDeviceResponseDto,
    DeleteUserHwidDeviceRequestDto,
    DeleteUserHwidDeviceResponseDto,
    GetUserHwidDevicesRequestDto,
    GetUserHwidDevicesResponseDto,
} from './dtos';
import { HwidUserDevicesService } from './hwid-user-devices.service';
import { BaseUserHwidDevicesResponseModel } from './models';

@ApiBearerAuth('Authorization')
@ApiTags('HWID User Devices')
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(HWID_CONTROLLER)
export class HwidUserDevicesController {
    constructor(private readonly hwidUserDevicesService: HwidUserDevicesService) {}

    @ApiOkResponse({
        type: CreateUserHwidDeviceResponseDto,
        description: 'User HWID device created successfully',
    })
    @Endpoint({
        command: CreateUserHwidDeviceCommand,
        httpCode: HttpStatus.OK,
        apiBody: CreateUserHwidDeviceRequestDto,
    })
    async createUserHwidDevice(
        @Body() body: CreateUserHwidDeviceRequestDto,
    ): Promise<CreateUserHwidDeviceResponseDto> {
        const result = await this.hwidUserDevicesService.createUserHwidDevice(body);

        const data = errorHandler(result);
        return {
            response: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
        };
    }

    @ApiOkResponse({
        type: DeleteUserHwidDeviceResponseDto,
        description: 'User HWID device deleted successfully',
    })
    @Endpoint({
        command: DeleteUserHwidDeviceCommand,
        httpCode: HttpStatus.OK,
        apiBody: DeleteUserHwidDeviceRequestDto,
    })
    async deleteUserHwidDevice(
        @Body() body: DeleteUserHwidDeviceRequestDto,
    ): Promise<DeleteUserHwidDeviceResponseDto> {
        const result = await this.hwidUserDevicesService.deleteUserHwidDevice(
            body.hwid,
            body.userUuid,
        );

        const data = errorHandler(result);
        return {
            response: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
        };
    }

    @ApiOkResponse({
        type: GetUserHwidDevicesResponseDto,
        description: 'User HWID devices fetched successfully',
    })
    @ApiParam({ name: 'userUuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: GetUserHwidDevicesCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserHwidDevices(
        @Param() paramData: GetUserHwidDevicesRequestDto,
    ): Promise<GetUserHwidDevicesResponseDto> {
        const result = await this.hwidUserDevicesService.getUserHwidDevices(paramData.userUuid);

        const data = errorHandler(result);
        return {
            response: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
        };
    }
}
