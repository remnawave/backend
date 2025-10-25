import { createZodDto } from 'nestjs-zod';

import { UpdateRemnawaveSettingsCommand } from '@libs/contracts/commands';

export class UpdateRemnawaveSettingsRequestDto extends createZodDto(
    UpdateRemnawaveSettingsCommand.RequestSchema,
) {}

export class UpdateRemnawaveSettingsResponseDto extends createZodDto(
    UpdateRemnawaveSettingsCommand.ResponseSchema,
) {}
