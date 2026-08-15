import { createZodDto } from 'nestjs-zod';

import {
    CreateNodeIntegrationCommand,
    DeleteNodeIntegrationCommand,
    GetNodeIntegrationCommand,
    GetNodeIntegrationsCommand,
    UpdateNodeIntegrationCommand,
} from '@libs/contracts/commands';

export class GetNodeIntegrationsResponseDto extends createZodDto(
    GetNodeIntegrationsCommand.ResponseSchema,
) {} // GET_ALL

export class GetNodeIntegrationParamDto extends createZodDto(
    GetNodeIntegrationCommand.RequestParamSchema,
) {} // GET BY UUID
export class GetNodeIntegrationResponseDto extends createZodDto(
    GetNodeIntegrationCommand.ResponseSchema,
) {} // GET BY UUID

export class CreateNodeIntegrationBodyDto extends createZodDto(
    CreateNodeIntegrationCommand.RequestBodySchema,
) {} // CREATE
export class CreateNodeIntegrationResponseDto extends createZodDto(
    CreateNodeIntegrationCommand.ResponseSchema,
) {} // CREATE

export class UpdateNodeIntegrationBodyDto extends createZodDto(
    UpdateNodeIntegrationCommand.RequestBodySchema,
) {} // UPDATE
export class UpdateNodeIntegrationResponseDto extends createZodDto(
    UpdateNodeIntegrationCommand.ResponseSchema,
) {} // UPDATE

export class DeleteNodeIntegrationParamDto extends createZodDto(
    DeleteNodeIntegrationCommand.RequestParamSchema,
) {} // DELETE
