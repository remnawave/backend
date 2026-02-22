import { createZodDto } from 'nestjs-zod';

import { GetUserIpsResultCommand, CreateUserIpsJobCommand } from '@contract/commands';

export class CreateUserIpsJobRequestDto extends createZodDto(
    CreateUserIpsJobCommand.RequestSchema,
) {}

export class CreateUserIpsJobResponseDto extends createZodDto(
    CreateUserIpsJobCommand.ResponseSchema,
) {}

export class GetUserIpsResultRequestDto extends createZodDto(
    GetUserIpsResultCommand.RequestSchema,
) {}

export class GetUserIpsResultResponseDto extends createZodDto(
    GetUserIpsResultCommand.ResponseSchema,
) {}
