import { createZodDto } from 'nestjs-zod';

import {
    GetSubscriptionPageConfigsCommand,
    UpdateSubscriptionPageConfigCommand,
    GetSubscriptionPageConfigCommand,
    DeleteSubscriptionPageConfigCommand,
    CreateSubscriptionPageConfigCommand,
    ReorderSubscriptionPageConfigsCommand,
    CloneSubscriptionPageConfigCommand,
} from '@libs/contracts/commands';

export class GetSubscriptionPageConfigsResponseDto extends createZodDto(
    GetSubscriptionPageConfigsCommand.ResponseSchema,
) {} // GET_ALL

export class UpdateSubscriptionPageConfigRequestDto extends createZodDto(
    UpdateSubscriptionPageConfigCommand.RequestSchema,
) {} // UPDATE

export class UpdateSubscriptionPageConfigResponseDto extends createZodDto(
    UpdateSubscriptionPageConfigCommand.ResponseSchema,
) {} // UPDATE

export class GetSubscriptionPageConfigResponseDto extends createZodDto(
    GetSubscriptionPageConfigCommand.ResponseSchema,
) {} // GET BY UUID

export class GetSubscriptionPageConfigRequestDto extends createZodDto(
    GetSubscriptionPageConfigCommand.RequestSchema,
) {} // GET BY UUID

export class DeleteSubscriptionPageConfigRequestDto extends createZodDto(
    DeleteSubscriptionPageConfigCommand.RequestSchema,
) {} // DELETE

export class DeleteSubscriptionPageConfigResponseDto extends createZodDto(
    DeleteSubscriptionPageConfigCommand.ResponseSchema,
) {} // DELETE

export class CreateSubscriptionPageConfigRequestDto extends createZodDto(
    CreateSubscriptionPageConfigCommand.RequestSchema,
) {} // CREATE

export class CreateSubscriptionPageConfigResponseDto extends createZodDto(
    CreateSubscriptionPageConfigCommand.ResponseSchema,
) {} // CREATE

export class ReorderSubscriptionPageConfigsRequestDto extends createZodDto(
    ReorderSubscriptionPageConfigsCommand.RequestSchema,
) {} // REORDER
export class ReorderSubscriptionPageConfigsResponseDto extends createZodDto(
    ReorderSubscriptionPageConfigsCommand.ResponseSchema,
) {} // REORDER

export class CloneSubscriptionPageConfigRequestDto extends createZodDto(
    CloneSubscriptionPageConfigCommand.RequestSchema,
) {} // CLONE
export class CloneSubscriptionPageConfigResponseDto extends createZodDto(
    CloneSubscriptionPageConfigCommand.ResponseSchema,
) {} // CLONE
