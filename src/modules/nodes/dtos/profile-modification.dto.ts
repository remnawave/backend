import { createZodDto } from 'nestjs-zod';

import { BulkNodesProfileModificationCommand } from '@contract/commands';

export class ProfileModificationResponseDto extends createZodDto(
    BulkNodesProfileModificationCommand.ResponseSchema,
) {}

export class ProfileModificationRequestDto extends createZodDto(
    BulkNodesProfileModificationCommand.RequestSchema,
) {}
