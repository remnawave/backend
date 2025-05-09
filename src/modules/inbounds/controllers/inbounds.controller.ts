import { Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { GetFullInboundsCommand, GetInboundsCommand } from '@libs/contracts/commands';
import { INBOUNDS_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import { GetFullInboundsResponseDto, GetInboundsResponseDto } from '../dtos';
import { GetBaseInboundsResponseModel } from '../models';
import { InboundsService } from '../inbounds.service';

@ApiBearerAuth('Authorization')
@ApiTags('Inbounds Controller')
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(INBOUNDS_CONTROLLER)
export class InboundsController {
    constructor(private readonly inboundsService: InboundsService) {}

    @ApiOkResponse({
        type: GetInboundsResponseDto,
        description: 'Get inbounds',
    })
    @Endpoint({
        command: GetInboundsCommand,
        httpCode: HttpStatus.OK,
    })
    async getInbounds(): Promise<GetInboundsResponseDto> {
        const result = await this.inboundsService.getInbounds();

        const data = errorHandler(result);
        return {
            response: data.map((value) => new GetBaseInboundsResponseModel(value)),
        };
    }

    @ApiOkResponse({
        type: GetFullInboundsResponseDto,
        description: 'Get full inbounds',
    })
    @Endpoint({
        command: GetFullInboundsCommand,
        httpCode: HttpStatus.OK,
    })
    async getFullInbounds(): Promise<GetFullInboundsResponseDto> {
        const result = await this.inboundsService.getFullInbounds();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
