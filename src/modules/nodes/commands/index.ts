import { DeleteNodeByUuidHandler } from './delete-node-by-uuid';
import { IncrementUsedTrafficHandler } from './increment-used-traffic';
import { RemoveIntegrationFromNodesHandler } from './remove-integration-from-nodes';
import { SyncActiveProfileHandler } from './sync-active-profile';
import { UpdateNodeHandler } from './update-node';

export const COMMANDS = [
    UpdateNodeHandler,
    IncrementUsedTrafficHandler,
    SyncActiveProfileHandler,
    DeleteNodeByUuidHandler,
    RemoveIntegrationFromNodesHandler,
];
