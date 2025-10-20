import { createZodDto } from 'nestjs-zod';

import { GetExternalSquadsCommand } from '@libs/contracts/commands';

export class GetExternalSquadsResponseDto extends createZodDto(
    GetExternalSquadsCommand.ResponseSchema,
) {}
