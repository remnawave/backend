import { createZodDto } from 'nestjs-zod';

import { FetchIpsCommand, FetchIpsResultCommand, DropConnectionsCommand } from '@contract/commands';

export class FetchIpsRequestDto extends createZodDto(FetchIpsCommand.RequestSchema) {}

export class FetchIpsResponseDto extends createZodDto(FetchIpsCommand.ResponseSchema) {}

export class FetchIpsResultRequestDto extends createZodDto(FetchIpsResultCommand.RequestSchema) {}

export class FetchIpsResultResponseDto extends createZodDto(FetchIpsResultCommand.ResponseSchema) {}

export class DropConnectionsRequestDto extends createZodDto(DropConnectionsCommand.RequestSchema) {}

export class DropConnectionsResponseDto extends createZodDto(
    DropConnectionsCommand.ResponseSchema,
) {}
