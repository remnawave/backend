import { createZodDto } from 'nestjs-zod';

import { GetAllPasskeysCommand } from '@libs/contracts/commands';

export class GetAllPasskeysResponseDto extends createZodDto(GetAllPasskeysCommand.ResponseSchema) {}
