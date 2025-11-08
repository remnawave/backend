import { createZodDto } from 'nestjs-zod';

import { GetRemnawaveSettingsCommand } from '@libs/contracts/commands';

export class GetRemnawaveSettingsResponseDto extends createZodDto(
    GetRemnawaveSettingsCommand.ResponseSchema,
) {}
