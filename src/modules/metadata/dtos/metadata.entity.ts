import { createZodDto } from 'nestjs-zod';

import {
    UpsertNodeMetadataCommand,
    UpsertUserMetadataCommand,
    GetNodeMetadataCommand,
    GetUserMetadataCommand,
} from '@libs/contracts/commands';

export class GetNodeMetadataRequestParamDto extends createZodDto(
    GetNodeMetadataCommand.RequestParamsSchema,
) {}
export class GetNodeMetadataResponseDto extends createZodDto(
    GetNodeMetadataCommand.ResponseSchema,
) {}

export class UpsertNodeMetadataRequestParamDto extends createZodDto(
    UpsertNodeMetadataCommand.RequestParamsSchema,
) {}
export class UpsertNodeMetadataRequestBodyDto extends createZodDto(
    UpsertNodeMetadataCommand.RequestBodySchema,
) {}
export class UpsertNodeMetadataResponseDto extends createZodDto(
    UpsertNodeMetadataCommand.ResponseSchema,
) {}

export class GetUserMetadataRequestParamDto extends createZodDto(
    GetUserMetadataCommand.RequestParamsSchema,
) {}
export class GetUserMetadataResponseDto extends createZodDto(
    GetUserMetadataCommand.ResponseSchema,
) {}

export class UpsertUserMetadataRequestParamDto extends createZodDto(
    UpsertUserMetadataCommand.RequestParamsSchema,
) {}
export class UpsertUserMetadataRequestBodyDto extends createZodDto(
    UpsertUserMetadataCommand.RequestBodySchema,
) {}

export class UpsertUserMetadataResponseDto extends createZodDto(
    UpsertUserMetadataCommand.ResponseSchema,
) {}
