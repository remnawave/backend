import { createZodDto } from 'nestjs-zod';

import { GetActualUsersCommand } from '@contract/commands';

export class GetActualUsersRequestParamDto extends createZodDto(
    GetActualUsersCommand.RequestSchema,
) {}
export class GetActualUsersResponseDto extends createZodDto(GetActualUsersCommand.ResponseSchema) {}
