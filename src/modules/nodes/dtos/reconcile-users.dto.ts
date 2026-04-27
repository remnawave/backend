import { createZodDto } from 'nestjs-zod';

import { ReconcileUsersCommand } from '@contract/commands';

export class ReconcileUsersRequestParamDto extends createZodDto(
    ReconcileUsersCommand.RequestSchema,
) {}
export class ReconcileUsersResponseDto extends createZodDto(ReconcileUsersCommand.ResponseSchema) {}
