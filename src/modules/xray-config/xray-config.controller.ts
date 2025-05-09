import { ERRORS, ROLE } from '@contract/constants';
import { XRAY_CONTROLLER } from '@contract/api';

import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { GetXrayConfigCommand, UpdateXrayConfigCommand } from '@libs/contracts/commands';

import { UpdateConfigRequestDto, UpdateConfigResponseDto } from './dtos/update-config.dto';
import { GetConfigResponseModel } from './models/get-config.response.model';
import { GetConfigResponseDto } from './dtos/get-config.dto';
import { XrayConfigService } from './xray-config.service';

@ApiBearerAuth('Authorization')
@ApiTags('Xray Config Controller')
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(XRAY_CONTROLLER)
export class XrayConfigController {
    constructor(private readonly xrayConfigService: XrayConfigService) {}

    @ApiBadRequestResponse({ description: ERRORS.GET_CONFIG_ERROR.message })
    @ApiOkResponse({
        type: GetConfigResponseDto,
        description: 'Configuration retrieved successfully',
    })
    @Endpoint({
        command: GetXrayConfigCommand,
        httpCode: HttpStatus.OK,
    })
    async getConfig(): Promise<GetConfigResponseDto> {
        const result = await this.xrayConfigService.getConfig();

        const data = errorHandler(result);
        return {
            response: new GetConfigResponseModel(data),
        };
    }

    @ApiBadRequestResponse({ description: ERRORS.UPDATE_CONFIG_ERROR.message })
    @ApiOkResponse({
        type: UpdateConfigResponseDto,
        description: 'Configuration updated successfully',
    })
    @Endpoint({
        command: UpdateXrayConfigCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateConfigRequestDto,
    })
    async updateConfig(
        @Body() requestConfig: UpdateConfigRequestDto,
    ): Promise<UpdateConfigResponseDto> {
        const result = await this.xrayConfigService.updateConfigFromController(requestConfig);

        const data = errorHandler(result);
        return {
            response: new GetConfigResponseModel(data.config || {}),
        };
    }
}
