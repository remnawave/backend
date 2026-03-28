import { createZodDto } from 'nestjs-zod';

import { BulkNodesUpdateCommand } from '@contract/commands';

export class BulkNodesUpdateResponseDto extends createZodDto(
    BulkNodesUpdateCommand.ResponseSchema,
) {}

export class BulkNodesUpdateRequestDto extends createZodDto(BulkNodesUpdateCommand.RequestSchema) {}
