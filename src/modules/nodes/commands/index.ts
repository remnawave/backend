import { IncrementUsedTrafficHandler } from './increment-used-traffic';
import { SyncActiveProfileHandler } from './sync-active-profile';
import { DeleteNodeByUuidHandler } from './delete-node-by-uuid';
import { UpdateNodeHandler } from './update-node';

export const COMMANDS = [
    UpdateNodeHandler,
    IncrementUsedTrafficHandler,
    SyncActiveProfileHandler,
    DeleteNodeByUuidHandler,
];
