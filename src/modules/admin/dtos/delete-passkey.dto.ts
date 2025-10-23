import { createZodDto } from 'nestjs-zod';

import { DeletePasskeyCommand } from '@libs/contracts/commands';

export class DeletePasskeyRequestDto extends createZodDto(DeletePasskeyCommand.RequestSchema) {}
export class DeletePasskeyResponseDto extends createZodDto(DeletePasskeyCommand.ResponseSchema) {}
