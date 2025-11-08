import { Body, Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    CreateUserHwidDeviceCommand,
    DeleteAllUserHwidDevicesCommand,
    DeleteUserHwidDeviceCommand,
    GetAllHwidDevicesCommand,
    GetHwidDevicesStatsCommand,
    GetUserHwidDevicesCommand,
} from '@libs/contracts/commands';
import { CONTROLLERS_INFO, HWID_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    CreateUserHwidDeviceRequestDto,
    CreateUserHwidDeviceResponseDto,
    DeleteAllUserHwidDevicesRequestDto,
    DeleteAllUserHwidDevicesResponseDto,
    DeleteUserHwidDeviceRequestDto,
    DeleteUserHwidDeviceResponseDto,
    GetAllHwidDevicesRequestQueryDto,
    GetAllHwidDevicesResponseDto,
    GetHwidDevicesStatsResponseDto,
    GetUserHwidDevicesRequestDto,
    GetUserHwidDevicesResponseDto,
} from './dtos';
import { BaseUserHwidDevicesResponseModel, GetAllHwidDevicesResponseModel } from './models';
import { HwidUserDevicesService } from './hwid-user-devices.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.HWID_USER_DEVICES.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(HWID_CONTROLLER)
export class HwidUserDevicesController {
    constructor(private readonly hwidUserDevicesService: HwidUserDevicesService) {}

    @ApiOkResponse({
        type: GetAllHwidDevicesResponseDto,
        description: 'Hwid devices fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetAllHwidDevicesCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllUsers(
        @Query() query: GetAllHwidDevicesRequestQueryDto,
    ): Promise<GetAllHwidDevicesResponseDto> {
        const { start, size, filters, filterModes, globalFilterMode, sorting } = query;
        const result = await this.hwidUserDevicesService.getAllHwidDevices({
            start,
            size,
            filters,
            filterModes,
            globalFilterMode,
            sorting,
        });

        const data = errorHandler(result);
        return {
            response: new GetAllHwidDevicesResponseModel({
                total: data.total,
                devices: data.devices.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            }),
        };
    }

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
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
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
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }

    @ApiOkResponse({
        type: DeleteAllUserHwidDevicesResponseDto,
        description: 'User HWID devices deleted successfully',
    })
    @Endpoint({
        command: DeleteAllUserHwidDevicesCommand,
        httpCode: HttpStatus.OK,
        apiBody: DeleteAllUserHwidDevicesRequestDto,
    })
    async deleteAllUserHwidDevices(
        @Body() body: DeleteAllUserHwidDevicesRequestDto,
    ): Promise<DeleteAllUserHwidDevicesResponseDto> {
        const result = await this.hwidUserDevicesService.deleteAllUserHwidDevices(body.userUuid);

        const data = errorHandler(result);
        return {
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }

    @ApiOkResponse({
        type: GetHwidDevicesStatsResponseDto,
        description: 'Hwid devices stats fetched successfully',
    })
    @Endpoint({
        command: GetHwidDevicesStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getHwidDevicesStats(): Promise<GetHwidDevicesStatsResponseDto> {
        const result = await this.hwidUserDevicesService.getHwidDevicesStats();

        const data = errorHandler(result);
        return {
            response: data,
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
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }
}
