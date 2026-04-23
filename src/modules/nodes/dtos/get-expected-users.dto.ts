import { createZodDto } from 'nestjs-zod';

import { GetExpectedUsersCommand } from '@contract/commands';

export class GetExpectedUsersRequestParamDto extends createZodDto(
    GetExpectedUsersCommand.RequestSchema,
) {}
export class GetExpectedUsersResponseDto extends createZodDto(
    GetExpectedUsersCommand.ResponseSchema,
) {}
