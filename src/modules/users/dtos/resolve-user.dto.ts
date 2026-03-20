import { createZodDto } from 'nestjs-zod';

import { ResolveUserCommand } from '@libs/contracts/commands/users/resolve-user.command';

export class ResolveUserRequestBodyDto extends createZodDto(ResolveUserCommand.RequestSchema) {}
export class ResolveUserResponseDto extends createZodDto(ResolveUserCommand.ResponseSchema) {}
