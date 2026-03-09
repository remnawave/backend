import { createZodDto } from 'nestjs-zod';

import {
    FetchIpsCommand,
    FetchIpsResultCommand,
    DropConnectionsCommand,
    FetchUsersIpsResultCommand,
    FetchUsersIpsCommand,
} from '@contract/commands';

export class FetchIpsRequestDto extends createZodDto(FetchIpsCommand.RequestSchema) {}

export class FetchIpsResponseDto extends createZodDto(FetchIpsCommand.ResponseSchema) {}

export class FetchIpsResultRequestDto extends createZodDto(FetchIpsResultCommand.RequestSchema) {}

export class FetchIpsResultResponseDto extends createZodDto(FetchIpsResultCommand.ResponseSchema) {}

export class DropConnectionsRequestDto extends createZodDto(DropConnectionsCommand.RequestSchema) {}

export class DropConnectionsResponseDto extends createZodDto(
    DropConnectionsCommand.ResponseSchema,
) {}

export class FetchUsersIpsRequestDto extends createZodDto(FetchUsersIpsCommand.RequestSchema) {}

export class FetchUsersIpsResponseDto extends createZodDto(FetchUsersIpsCommand.ResponseSchema) {}

export class FetchUsersIpsResultRequestDto extends createZodDto(
    FetchUsersIpsResultCommand.RequestSchema,
) {}

export class FetchUsersIpsResultResponseDto extends createZodDto(
    FetchUsersIpsResultCommand.ResponseSchema,
) {}
