import { createZodDto } from 'nestjs-zod';

import { GetPasskeyRegistrationOptionsCommand } from '@libs/contracts/commands';

export class GetPasskeyRegistrationOptionsResponseDto extends createZodDto(
    GetPasskeyRegistrationOptionsCommand.ResponseSchema,
) {}
