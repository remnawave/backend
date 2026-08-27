import { createZodDto } from 'nestjs-zod';

import {
    GetSubscriptionTemplatesTagsCommand,
    SetSubscriptionTemplateTagsCommand,
} from '@libs/contracts/commands';

export class GetSubscriptionTemplatesTagsResponseDto extends createZodDto(
    GetSubscriptionTemplatesTagsCommand.ResponseSchema,
) {}

export class SetSubscriptionTemplatesTagsBodyDto extends createZodDto(
    SetSubscriptionTemplateTagsCommand.RequestBodySchema,
) {}
export class SetSubscriptionTemplatesTagsResponseDto extends createZodDto(
    SetSubscriptionTemplateTagsCommand.ResponseSchema,
) {}
