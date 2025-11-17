import { createZodDto } from 'nestjs-zod';

import { ReorderConfigProfileCommand } from '@libs/contracts/commands';

export class ReorderConfigProfilesRequestDto extends createZodDto(
    ReorderConfigProfileCommand.RequestSchema,
) {}
export class ReorderConfigProfilesResponseDto extends createZodDto(
    ReorderConfigProfileCommand.ResponseSchema,
) {}
