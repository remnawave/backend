import { createZodDto } from 'nestjs-zod';

import { VerifyPasskeyRegistrationCommand } from '@libs/contracts/commands';

export class VerifyPasskeyRegistrationRequestDto extends createZodDto(
    VerifyPasskeyRegistrationCommand.RequestSchema,
) {}
export class VerifyPasskeyRegistrationResponseDto extends createZodDto(
    VerifyPasskeyRegistrationCommand.ResponseSchema,
) {}
