import { createZodDto } from 'nestjs-zod';

import { TestSrrMatcherCommand } from '@contract/commands';

export class DebugSrrMatcherRequestDto extends createZodDto(TestSrrMatcherCommand.RequestSchema) {}

export class DebugSrrMatcherResponseDto extends createZodDto(
    TestSrrMatcherCommand.ResponseSchema,
) {}
