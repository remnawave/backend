import { createZodDto } from 'nestjs-zod';

import { GetComputedConfigProfileByUuidCommand } from '@libs/contracts/commands';

export class GetComputedConfigProfileByUuidRequestDto extends createZodDto(
    GetComputedConfigProfileByUuidCommand.RequestSchema,
) {}
export class GetComputedConfigProfileByUuidResponseDto extends createZodDto(
    GetComputedConfigProfileByUuidCommand.ResponseSchema,
) {}
