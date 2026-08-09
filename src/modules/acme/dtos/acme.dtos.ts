import { createZodDto } from 'nestjs-zod';

import {
    CreateAcmeCertificateCommand,
    CreateAcmeCredentialCommand,
    DeleteAcmeCertificateCommand,
    DeleteAcmeCredentialCommand,
    GetAcmeCertificateCommand,
    GetAcmeCertificateEventsCommand,
    GetAcmeCertificatesCommand,
    GetAcmeCredentialsCommand,
    GetAcmePersistRecordCommand,
    ImportAcmeCertificateCommand,
    IssueAcmeCertificateCommand,
    PublishAcmePersistRecordCommand,
    ReimportAcmeCertificateCommand,
    TestAcmeCredentialCommand,
    UpdateAcmeCertificateCommand,
    UpdateAcmeCredentialCommand,
} from '@libs/contracts/commands';

// Credentials

export class GetAcmeCredentialsResponseDto extends createZodDto(
    GetAcmeCredentialsCommand.ResponseSchema,
) {}

export class CreateAcmeCredentialBodyDto extends createZodDto(
    CreateAcmeCredentialCommand.RequestBodySchema,
) {}

export class CreateAcmeCredentialResponseDto extends createZodDto(
    CreateAcmeCredentialCommand.ResponseSchema,
) {}

export class UpdateAcmeCredentialBodyDto extends createZodDto(
    UpdateAcmeCredentialCommand.RequestBodySchema,
) {}

export class UpdateAcmeCredentialResponseDto extends createZodDto(
    UpdateAcmeCredentialCommand.ResponseSchema,
) {}

export class DeleteAcmeCredentialParamDto extends createZodDto(
    DeleteAcmeCredentialCommand.RequestParamSchema,
) {}

export class DeleteAcmeCredentialResponseDto extends createZodDto(
    DeleteAcmeCredentialCommand.ResponseSchema,
) {}

export class TestAcmeCredentialParamDto extends createZodDto(
    TestAcmeCredentialCommand.RequestParamSchema,
) {}

export class TestAcmeCredentialResponseDto extends createZodDto(
    TestAcmeCredentialCommand.ResponseSchema,
) {}

// Certificates

export class GetAcmeCertificatesResponseDto extends createZodDto(
    GetAcmeCertificatesCommand.ResponseSchema,
) {}

export class GetAcmeCertificateParamDto extends createZodDto(
    GetAcmeCertificateCommand.RequestParamSchema,
) {}

export class GetAcmeCertificateResponseDto extends createZodDto(
    GetAcmeCertificateCommand.ResponseSchema,
) {}

export class CreateAcmeCertificateBodyDto extends createZodDto(
    CreateAcmeCertificateCommand.RequestBodySchema,
) {}

export class CreateAcmeCertificateResponseDto extends createZodDto(
    CreateAcmeCertificateCommand.ResponseSchema,
) {}

export class UpdateAcmeCertificateBodyDto extends createZodDto(
    UpdateAcmeCertificateCommand.RequestBodySchema,
) {}

export class UpdateAcmeCertificateResponseDto extends createZodDto(
    UpdateAcmeCertificateCommand.ResponseSchema,
) {}

export class DeleteAcmeCertificateParamDto extends createZodDto(
    DeleteAcmeCertificateCommand.RequestParamSchema,
) {}

export class DeleteAcmeCertificateResponseDto extends createZodDto(
    DeleteAcmeCertificateCommand.ResponseSchema,
) {}

export class IssueAcmeCertificateParamDto extends createZodDto(
    IssueAcmeCertificateCommand.RequestParamSchema,
) {}

export class IssueAcmeCertificateResponseDto extends createZodDto(
    IssueAcmeCertificateCommand.ResponseSchema,
) {}

export class ImportAcmeCertificateBodyDto extends createZodDto(
    ImportAcmeCertificateCommand.RequestBodySchema,
) {}

export class ImportAcmeCertificateResponseDto extends createZodDto(
    ImportAcmeCertificateCommand.ResponseSchema,
) {}

export class ReimportAcmeCertificateParamDto extends createZodDto(
    ReimportAcmeCertificateCommand.RequestParamSchema,
) {}

export class ReimportAcmeCertificateBodyDto extends createZodDto(
    ReimportAcmeCertificateCommand.RequestBodySchema,
) {}

export class ReimportAcmeCertificateResponseDto extends createZodDto(
    ReimportAcmeCertificateCommand.ResponseSchema,
) {}

export class GetAcmeCertificateEventsParamDto extends createZodDto(
    GetAcmeCertificateEventsCommand.RequestParamSchema,
) {}

export class GetAcmeCertificateEventsResponseDto extends createZodDto(
    GetAcmeCertificateEventsCommand.ResponseSchema,
) {}

export class GetAcmePersistRecordParamDto extends createZodDto(
    GetAcmePersistRecordCommand.RequestParamSchema,
) {}

export class GetAcmePersistRecordResponseDto extends createZodDto(
    GetAcmePersistRecordCommand.ResponseSchema,
) {}

export class PublishAcmePersistRecordParamDto extends createZodDto(
    PublishAcmePersistRecordCommand.RequestParamSchema,
) {}

export class PublishAcmePersistRecordResponseDto extends createZodDto(
    PublishAcmePersistRecordCommand.ResponseSchema,
) {}
