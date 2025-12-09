import { createZodDto } from 'nestjs-zod';

import { GetTopUsersByHwidDevicesCommand } from '@contract/commands';

export class GetTopUsersByHwidDevicesRequestQueryDto extends createZodDto(
    GetTopUsersByHwidDevicesCommand.RequestQuerySchema,
) {}

export class GetTopUsersByHwidDevicesResponseDto extends createZodDto(
    GetTopUsersByHwidDevicesCommand.ResponseSchema,
) {}
