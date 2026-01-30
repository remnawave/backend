import { createZodDto } from 'nestjs-zod';

import { BulkNodesActionsCommand } from '@contract/commands';

export class BulkNodesActionsResponseDto extends createZodDto(
    BulkNodesActionsCommand.ResponseSchema,
) {}

export class BulkNodesActionsRequestDto extends createZodDto(
    BulkNodesActionsCommand.RequestSchema,
) {}
