import { createZodDto } from 'nestjs-zod';

import { UpdatePasskeyCommand } from '@libs/contracts/commands';

export class UpdatePasskeyRequestDto extends createZodDto(UpdatePasskeyCommand.RequestSchema) {}
export class UpdatePasskeyResponseDto extends createZodDto(UpdatePasskeyCommand.ResponseSchema) {}
