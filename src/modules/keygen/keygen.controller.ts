import { Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { CONTROLLERS_INFO, KEYGEN_CONTROLLER } from '@libs/contracts/api';
import { GetPubKeyCommand } from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { KeygenService } from './keygen.service';
import { GetPubKeyResponseDto } from './dtos';
import { KeygenResponseModel } from './model';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.KEYGEN.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(KEYGEN_CONTROLLER)
export class KeygenController {
    constructor(private readonly keygenService: KeygenService) {}

    @ApiOkResponse({
        type: GetPubKeyResponseDto,
        description: 'Get SSL_CERT for Remnawave Node',
    })
    @Endpoint({
        command: GetPubKeyCommand,
        httpCode: HttpStatus.OK,
    })
    async generateKey(): Promise<GetPubKeyResponseDto> {
        const result = await this.keygenService.generateKey();

        const data = errorHandler(result);
        return {
            response: new KeygenResponseModel(data.payload),
        };
    }
}
