import { createZodDto } from 'nestjs-zod';

import { OAuth2CallbackCommand } from '@libs/contracts/commands';

export class OAuth2CallbackRequestDto extends createZodDto(OAuth2CallbackCommand.RequestSchema) {}
export class OAuth2CallbackResponseDto extends createZodDto(OAuth2CallbackCommand.ResponseSchema) {}
