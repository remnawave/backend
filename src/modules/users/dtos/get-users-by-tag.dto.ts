import { createZodDto } from 'nestjs-zod';

import { GetUserByTagCommand } from '@libs/contracts/commands';

export class GetUserByTagRequestDto extends createZodDto(GetUserByTagCommand.RequestSchema) {}
export class GetUserByTagResponseDto extends createZodDto(GetUserByTagCommand.ResponseSchema) {}
