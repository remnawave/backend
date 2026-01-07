import { RemoveUsersFromNodeHandler } from './remove-users-from-node';
import { RemoveUserFromNodeHandler } from './remove-user-from-node';
import { AddUsersToNodeHandler } from './add-users-to-node';
import { AddUserToNodeHandler } from './add-user-to-node';

export const EVENTS = [
    AddUserToNodeHandler,
    RemoveUserFromNodeHandler,
    AddUsersToNodeHandler,
    RemoveUsersFromNodeHandler,
];
