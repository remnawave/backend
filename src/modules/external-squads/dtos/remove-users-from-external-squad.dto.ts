import { createZodDto } from 'nestjs-zod';

import { DeleteUsersFromExternalSquadCommand } from '@libs/contracts/commands';

export class RemoveUsersFromExternalSquadRequestDto extends createZodDto(
    DeleteUsersFromExternalSquadCommand.RequestSchema,
) {}

export class RemoveUsersFromExternalSquadResponseDto extends createZodDto(
    DeleteUsersFromExternalSquadCommand.ResponseSchema,
) {}
