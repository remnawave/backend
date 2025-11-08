import { CONTROLLERS_INFO, REMNAAWAVE_SETTINGS_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GetRemnawaveSettingsCommand,
    UpdateRemnawaveSettingsCommand,
} from '@libs/contracts/commands';

import {
    GetRemnawaveSettingsResponseDto,
    UpdateRemnawaveSettingsRequestDto,
    UpdateRemnawaveSettingsResponseDto,
} from './dto';
import { RemnawaveSettingsResponseModel } from './models/get-remnawave-settings.response.model';
import { RemnawaveSettingsService } from './remnawave-settings.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.REMNAAWAVE_SETTINGS.tag)
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(REMNAAWAVE_SETTINGS_CONTROLLER)
export class RemnawaveSettingsController {
    constructor(private readonly remnawaveSettingsService: RemnawaveSettingsService) {}

    @ApiOkResponse({
        type: GetRemnawaveSettingsResponseDto,
        description: 'Remnawave settings retrieved successfully',
    })
    @Endpoint({
        command: GetRemnawaveSettingsCommand,
        httpCode: HttpStatus.OK,
    })
    async getSettings(): Promise<GetRemnawaveSettingsResponseDto> {
        const result = await this.remnawaveSettingsService.getSettingsFromController();

        const data = errorHandler(result);
        return {
            response: new RemnawaveSettingsResponseModel(data),
        };
    }

    @ApiOkResponse({
        type: UpdateRemnawaveSettingsResponseDto,
        description: 'Subscription settings updated successfully',
    })
    @Endpoint({
        command: UpdateRemnawaveSettingsCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateRemnawaveSettingsRequestDto,
    })
    async updateSettings(
        @Body() body: UpdateRemnawaveSettingsRequestDto,
    ): Promise<UpdateRemnawaveSettingsResponseDto> {
        const result = await this.remnawaveSettingsService.updateSettingsFromController(body);

        const data = errorHandler(result);
        return {
            response: new RemnawaveSettingsResponseModel(data),
        };
    }
}
