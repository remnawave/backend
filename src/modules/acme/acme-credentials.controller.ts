import { ACME_CONTROLLER, CONTROLLERS_INFO } from '@contract/api';
import { ROLE } from '@contract/constants';

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
import {
    CreateAcmeCredentialCommand,
    DeleteAcmeCredentialCommand,
    GetAcmeCredentialsCommand,
    TestAcmeCredentialCommand,
    UpdateAcmeCredentialCommand,
} from '@libs/contracts/commands';

import {
    CreateAcmeCredentialBodyDto,
    CreateAcmeCredentialResponseDto,
    DeleteAcmeCredentialParamDto,
    DeleteAcmeCredentialResponseDto,
    GetAcmeCredentialsResponseDto,
    TestAcmeCredentialParamDto,
    TestAcmeCredentialResponseDto,
    UpdateAcmeCredentialBodyDto,
    UpdateAcmeCredentialResponseDto,
} from './dtos';
import { AcmeCredentialsService } from './services/acme-credentials.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.ACME.resource)
@ApiTags(CONTROLLERS_INFO.ACME.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(ACME_CONTROLLER)
export class AcmeCredentialsController {
    constructor(private readonly acmeCredentialsService: AcmeCredentialsService) {}

    @Endpoint({
        type: GetAcmeCredentialsResponseDto,
        command: GetAcmeCredentialsCommand,
        httpCode: HttpStatus.OK,
    })
    async getCredentials(): Promise<GetAcmeCredentialsResponseDto> {
        const result = await this.acmeCredentialsService.getAll();

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: CreateAcmeCredentialResponseDto,
        command: CreateAcmeCredentialCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createCredential(
        @Body() body: CreateAcmeCredentialBodyDto,
    ): Promise<CreateAcmeCredentialResponseDto> {
        const result = await this.acmeCredentialsService.create(body);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: UpdateAcmeCredentialResponseDto,
        command: UpdateAcmeCredentialCommand,
        httpCode: HttpStatus.OK,
    })
    async updateCredential(
        @Body() body: UpdateAcmeCredentialBodyDto,
    ): Promise<UpdateAcmeCredentialResponseDto> {
        const result = await this.acmeCredentialsService.update(body);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: TestAcmeCredentialResponseDto,
        command: TestAcmeCredentialCommand,
        httpCode: HttpStatus.OK,
    })
    async testCredential(
        @Param() param: TestAcmeCredentialParamDto,
    ): Promise<TestAcmeCredentialResponseDto> {
        const result = await this.acmeCredentialsService.test(param.uuid);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: DeleteAcmeCredentialResponseDto,
        command: DeleteAcmeCredentialCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteCredential(
        @Param() param: DeleteAcmeCredentialParamDto,
    ): Promise<DeleteAcmeCredentialResponseDto> {
        const result = await this.acmeCredentialsService.delete(param.uuid);

        return {
            response: errorHandler(result),
        };
    }
}
