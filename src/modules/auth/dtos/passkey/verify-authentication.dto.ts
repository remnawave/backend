import { createZodDto } from 'nestjs-zod';

import { VerifyPasskeyAuthenticationCommand } from '@libs/contracts/commands';

export class VerifyPasskeyAuthenticationRequestDto extends createZodDto(
    VerifyPasskeyAuthenticationCommand.RequestSchema,
) {}
export class VerifyPasskeyAuthenticationResponseDto extends createZodDto(
    VerifyPasskeyAuthenticationCommand.ResponseSchema,
) {}
