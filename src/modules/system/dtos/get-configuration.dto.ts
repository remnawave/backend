import { GetConfigurationCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class GetConfigurationResponseDto extends createZodDto(
    GetConfigurationCommand.ResponseSchema,
) {}
