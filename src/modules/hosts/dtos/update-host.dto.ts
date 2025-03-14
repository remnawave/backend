import { createZodDto } from 'nestjs-zod';

import { UpdateHostCommand } from '@libs/contracts/commands';

export class UpdateHostRequestDto extends createZodDto(UpdateHostCommand.RequestSchema) {}
export class UpdateHostResponseDto extends createZodDto(UpdateHostCommand.ResponseSchema) {}
