import { createZodDto } from 'nestjs-zod';

import { AddUsersToExternalSquadCommand } from '@libs/contracts/commands';

export class AddUsersToExternalSquadRequestDto extends createZodDto(
    AddUsersToExternalSquadCommand.RequestSchema,
) {}

export class AddUsersToExternalSquadResponseDto extends createZodDto(
    AddUsersToExternalSquadCommand.ResponseSchema,
) {}
