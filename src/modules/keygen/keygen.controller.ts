import { Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { Endpoint } from '@common/decorators/base-endpoint';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { GetPubKeyCommand } from '@libs/contracts/commands';
import { KEYGEN_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import { KeygenService } from './keygen.service';
import { GetPubKeyResponseDto } from './dtos';
import { KeygenResponseModel } from './model';

@ApiBearerAuth('Authorization')
@ApiTags('Keygen Controller')
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
