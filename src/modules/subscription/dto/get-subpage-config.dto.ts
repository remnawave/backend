import { createZodDto } from 'nestjs-zod';

import { GetSubpageConfigByShortUuidCommand } from '@libs/contracts/commands/subscriptions/subpage/get-subpage-config-by-shortuuid.command';

export class GetSubpageConfigByShortUuidRequestDto extends createZodDto(
    GetSubpageConfigByShortUuidCommand.RequestSchema,
) {}
export class GetSubpageConfigByShortUuidResponseDto extends createZodDto(
    GetSubpageConfigByShortUuidCommand.ResponseSchema,
) {}

export class GetSubpageConfigByShortUuidRequestBodyDto extends createZodDto(
    GetSubpageConfigByShortUuidCommand.RequestBodySchema,
) {}
