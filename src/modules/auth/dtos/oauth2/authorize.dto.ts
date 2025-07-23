import { createZodDto } from 'nestjs-zod';

import { OAuth2AuthorizeCommand } from '@libs/contracts/commands';

export class OAuth2AuthorizeRequestDto extends createZodDto(OAuth2AuthorizeCommand.RequestSchema) {}

export class OAuth2AuthorizeResponseDto extends createZodDto(
    OAuth2AuthorizeCommand.ResponseSchema,
) {}
