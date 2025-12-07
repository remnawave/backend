import { createZodDto } from 'nestjs-zod';

import { GetUserByIdCommand } from '@libs/contracts/commands';

export class GetUserByIdRequestDto extends createZodDto(GetUserByIdCommand.RequestSchema) {}
export class GetUserByIdResponseDto extends createZodDto(GetUserByIdCommand.ResponseSchema) {}
