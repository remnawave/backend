import { EncryptIncyCryptoLinkCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class EncryptIncyCryptoLinkRequestDto extends createZodDto(
    EncryptIncyCryptoLinkCommand.RequestSchema,
) {}

export class EncryptIncyCryptoLinkResponseDto extends createZodDto(
    EncryptIncyCryptoLinkCommand.ResponseSchema,
) {}
