import { ResetNodeInboundExclusionByNodeUuidHandler } from './reset-node-inbound-exclusions-by-node-uuid';
import { DeleteManyActiveInboundsByUserUuidHandler } from './delete-many-active-inbounds-by-user-uuid';
import { CreateManyUserActiveInboundsHandler } from './create-many-user-active-inbounds';
import { UpdateInboundHandler } from './update-inbound/update-inbound.handler';
import { DeleteManyInboundsHandler } from './delete-many-inbounds';
import { CreateManyInboundsHandler } from './create-many-inbounds';

export const COMMANDS = [
    DeleteManyInboundsHandler,
    CreateManyInboundsHandler,
    CreateManyUserActiveInboundsHandler,
    DeleteManyActiveInboundsByUserUuidHandler,
    ResetNodeInboundExclusionByNodeUuidHandler,
    UpdateInboundHandler,
];
