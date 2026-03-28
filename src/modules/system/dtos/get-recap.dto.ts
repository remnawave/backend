import { createZodDto } from 'nestjs-zod';

import { GetRecapCommand } from '@contract/commands';

export class GetRecapResponseDto extends createZodDto(GetRecapCommand.ResponseSchema) {}
