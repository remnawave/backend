import { CreateSshTicketCommand, EvaluateVaultCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class CreateSshTicketParamDto extends createZodDto(
    CreateSshTicketCommand.RequestParamSchema,
) {}

export class CreateSshTicketResponseDto extends createZodDto(
    CreateSshTicketCommand.ResponseSchema,
) {}

export class EvaluateVaultRequestBodyDto extends createZodDto(
    EvaluateVaultCommand.RequestBodySchema,
) {}

export class EvaluateVaultResponseDto extends createZodDto(EvaluateVaultCommand.ResponseSchema) {}
