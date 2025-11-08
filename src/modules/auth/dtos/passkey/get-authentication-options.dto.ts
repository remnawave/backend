import { createZodDto } from 'nestjs-zod';

import { GetPasskeyAuthenticationOptionsCommand } from '@libs/contracts/commands';

export class GetPasskeyAuthenticationOptionsResponseDto extends createZodDto(
    GetPasskeyAuthenticationOptionsCommand.ResponseSchema,
) {}
