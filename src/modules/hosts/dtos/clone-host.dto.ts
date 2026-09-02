import { createZodDto } from 'nestjs-zod';

import { CloneHostCommand } from '@libs/contracts/commands';

export class CloneHostBodyDto extends createZodDto(CloneHostCommand.RequestBodySchema) {}
