import { GetEnabledNodesPartialHandler } from './get-enabled-nodes-partial/get-enabled-nodes-partial.handler';
import { GetNodesByPluginUuidHandler } from './get-nodes-by-plugin-uuid';
import { FindNodesByCriteriaHandler } from './find-nodes-by-criteria';
import { GetNodesByCriteriaHandler } from './get-nodes-by-criteria';
import { CountOnlineUsersHandler } from './count-online-users';
import { GetEnabledNodesHandler } from './get-enabled-nodes';
import { GetOnlineNodesHandler } from './get-online-nodes';
import { GetNodeByUuidHandler } from './get-node-by-uuid';
import { GetAllNodesHandler } from './get-all-nodes';

export const QUERIES = [
    GetEnabledNodesHandler,
    GetOnlineNodesHandler,
    GetNodesByCriteriaHandler,
    GetAllNodesHandler,
    CountOnlineUsersHandler,
    GetNodeByUuidHandler,
    FindNodesByCriteriaHandler,
    GetEnabledNodesPartialHandler,
    GetNodesByPluginUuidHandler,
];
