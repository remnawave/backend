import { createZodDto } from 'nestjs-zod';

import {
    UpdateSubscriptionTemplateCommand,
    GetSubscriptionTemplateCommand,
    GetSubscriptionTemplatesCommand,
    DeleteSubscriptionTemplateCommand,
    CreateSubscriptionTemplateCommand,
} from '@libs/contracts/commands';

export class GetTemplatesResponseDto extends createZodDto(
    GetSubscriptionTemplatesCommand.ResponseSchema,
) {} // GET_ALL

export class UpdateTemplateRequestDto extends createZodDto(
    UpdateSubscriptionTemplateCommand.RequestSchema,
) {} // UPDATE

export class UpdateTemplateResponseDto extends createZodDto(
    UpdateSubscriptionTemplateCommand.ResponseSchema,
) {} // UPDATE

export class GetTemplateResponseDto extends createZodDto(
    GetSubscriptionTemplateCommand.ResponseSchema,
) {} // GET BY UUID

export class GetTemplateRequestDto extends createZodDto(
    GetSubscriptionTemplateCommand.RequestSchema,
) {} // GET BY UUID

export class DeleteSubscriptionTemplateRequestDto extends createZodDto(
    DeleteSubscriptionTemplateCommand.RequestSchema,
) {} // DELETE

export class DeleteSubscriptionTemplateResponseDto extends createZodDto(
    DeleteSubscriptionTemplateCommand.ResponseSchema,
) {} // DELETE

export class CreateSubscriptionTemplateRequestDto extends createZodDto(
    CreateSubscriptionTemplateCommand.RequestSchema,
) {} // CREATE

export class CreateSubscriptionTemplateResponseDto extends createZodDto(
    CreateSubscriptionTemplateCommand.ResponseSchema,
) {} // CREATE
