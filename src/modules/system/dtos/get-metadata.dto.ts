import { createZodDto } from 'nestjs-zod';

import { GetMetadataCommand } from '@contract/commands';

export class GetMetadataResponseDto extends createZodDto(GetMetadataCommand.ResponseSchema) {}
