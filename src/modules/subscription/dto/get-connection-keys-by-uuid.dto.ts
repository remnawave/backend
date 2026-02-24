import { createZodDto } from 'nestjs-zod';

import { GetConnectionKeysByUuidCommand } from '@libs/contracts/commands/subscriptions';

export class GetConnectionKeysByUuidRequestDto extends createZodDto(
    GetConnectionKeysByUuidCommand.RequestSchema,
) {}

export class GetConnectionKeysByUuidResponseDto extends createZodDto(
    GetConnectionKeysByUuidCommand.ResponseSchema,
) {}
