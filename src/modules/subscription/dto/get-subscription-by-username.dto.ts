import { createZodDto } from 'nestjs-zod';

import { GetSubscriptionByUsernameCommand } from '@libs/contracts/commands/subscriptions';

export class GetSubscriptionByUsernameRequestDto extends createZodDto(
    GetSubscriptionByUsernameCommand.RequestSchema,
) {}

export class GetSubscriptionByUsernameResponseDto extends createZodDto(
    GetSubscriptionByUsernameCommand.ResponseSchema,
) {}
