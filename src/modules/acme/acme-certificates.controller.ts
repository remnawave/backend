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
    CreateAcmeCertificateCommand,
    DeleteAcmeCertificateCommand,
    GetAcmeCertificateCommand,
    GetAcmeCertificateEventsCommand,
    GetAcmeCertificatesCommand,
    GetAcmePersistRecordCommand,
    ImportAcmeCertificateCommand,
    IssueAcmeCertificateCommand,
    PublishAcmePersistRecordCommand,
    ReimportAcmeCertificateCommand,
    UpdateAcmeCertificateCommand,
} from '@libs/contracts/commands';

import {
    CreateAcmeCertificateBodyDto,
    CreateAcmeCertificateResponseDto,
    DeleteAcmeCertificateParamDto,
    DeleteAcmeCertificateResponseDto,
    GetAcmeCertificateEventsParamDto,
    GetAcmeCertificateEventsResponseDto,
    GetAcmeCertificateParamDto,
    GetAcmeCertificateResponseDto,
    GetAcmeCertificatesResponseDto,
    GetAcmePersistRecordParamDto,
    GetAcmePersistRecordResponseDto,
    ImportAcmeCertificateBodyDto,
    ImportAcmeCertificateResponseDto,
    IssueAcmeCertificateParamDto,
    IssueAcmeCertificateResponseDto,
    PublishAcmePersistRecordParamDto,
    PublishAcmePersistRecordResponseDto,
    ReimportAcmeCertificateBodyDto,
    ReimportAcmeCertificateParamDto,
    ReimportAcmeCertificateResponseDto,
    UpdateAcmeCertificateBodyDto,
    UpdateAcmeCertificateResponseDto,
} from './dtos';
import { AcmeCertificatesService } from './services/acme-certificates.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.ACME.resource)
@ApiTags(CONTROLLERS_INFO.ACME.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(ACME_CONTROLLER)
export class AcmeCertificatesController {
    constructor(private readonly acmeCertificatesService: AcmeCertificatesService) {}

    @Endpoint({
        type: GetAcmeCertificatesResponseDto,
        command: GetAcmeCertificatesCommand,
        httpCode: HttpStatus.OK,
    })
    async getCertificates(): Promise<GetAcmeCertificatesResponseDto> {
        const result = await this.acmeCertificatesService.getAll();

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: GetAcmeCertificateResponseDto,
        command: GetAcmeCertificateCommand,
        httpCode: HttpStatus.OK,
    })
    async getCertificate(
        @Param() param: GetAcmeCertificateParamDto,
    ): Promise<GetAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.getByUuid(param.uuid);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: CreateAcmeCertificateResponseDto,
        command: CreateAcmeCertificateCommand,
        httpCode: HttpStatus.CREATED,
    })
    async createCertificate(
        @Body() body: CreateAcmeCertificateBodyDto,
    ): Promise<CreateAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.create(body);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: UpdateAcmeCertificateResponseDto,
        command: UpdateAcmeCertificateCommand,
        httpCode: HttpStatus.OK,
    })
    async updateCertificate(
        @Body() body: UpdateAcmeCertificateBodyDto,
    ): Promise<UpdateAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.update(body);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: DeleteAcmeCertificateResponseDto,
        command: DeleteAcmeCertificateCommand,
        httpCode: HttpStatus.OK,
    })
    async deleteCertificate(
        @Param() param: DeleteAcmeCertificateParamDto,
    ): Promise<DeleteAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.delete(param.uuid);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: ImportAcmeCertificateResponseDto,
        command: ImportAcmeCertificateCommand,
        httpCode: HttpStatus.CREATED,
    })
    async importCertificate(
        @Body() body: ImportAcmeCertificateBodyDto,
    ): Promise<ImportAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.import(body);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: ReimportAcmeCertificateResponseDto,
        command: ReimportAcmeCertificateCommand,
        httpCode: HttpStatus.OK,
    })
    async reimportCertificate(
        @Param() param: ReimportAcmeCertificateParamDto,
        @Body() body: ReimportAcmeCertificateBodyDto,
    ): Promise<ReimportAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.reimport(param.uuid, body);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: IssueAcmeCertificateResponseDto,
        command: IssueAcmeCertificateCommand,
        httpCode: HttpStatus.OK,
    })
    async issueCertificate(
        @Param() param: IssueAcmeCertificateParamDto,
    ): Promise<IssueAcmeCertificateResponseDto> {
        const result = await this.acmeCertificatesService.issue(param.uuid);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: GetAcmePersistRecordResponseDto,
        command: GetAcmePersistRecordCommand,
        httpCode: HttpStatus.OK,
    })
    async getPersistRecord(
        @Param() param: GetAcmePersistRecordParamDto,
    ): Promise<GetAcmePersistRecordResponseDto> {
        const result = await this.acmeCertificatesService.getPersistRecord(param.uuid);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: PublishAcmePersistRecordResponseDto,
        command: PublishAcmePersistRecordCommand,
        httpCode: HttpStatus.OK,
    })
    async publishPersistRecord(
        @Param() param: PublishAcmePersistRecordParamDto,
    ): Promise<PublishAcmePersistRecordResponseDto> {
        const result = await this.acmeCertificatesService.getPersistRecord(param.uuid, true);

        return {
            response: errorHandler(result),
        };
    }

    @Endpoint({
        type: GetAcmeCertificateEventsResponseDto,
        command: GetAcmeCertificateEventsCommand,
        httpCode: HttpStatus.OK,
    })
    async getCertificateEvents(
        @Param() param: GetAcmeCertificateEventsParamDto,
    ): Promise<GetAcmeCertificateEventsResponseDto> {
        const result = await this.acmeCertificatesService.getEvents(param.uuid);

        return {
            response: errorHandler(result),
        };
    }
}
