import { createZodDto } from 'nestjs-zod';

import { GetAllSubscriptionsCommand } from '@libs/contracts/commands/subscriptions';

export class GetAllSubscriptionsQueryDto extends createZodDto(
    GetAllSubscriptionsCommand.RequestQuerySchema,
) {}

export class GetAllSubscriptionsResponseDto extends createZodDto(
    GetAllSubscriptionsCommand.ResponseSchema,
) {}
