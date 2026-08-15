import { CountOnlineUsersHandler } from './count-online-users';
import { FindNodesByCriteriaHandler } from './find-nodes-by-criteria';
import { GetAllNodesHandler } from './get-all-nodes';
import { GetEnabledNodesHandler } from './get-enabled-nodes';
import { GetEnabledNodesPartialHandler } from './get-enabled-nodes-partial/get-enabled-nodes-partial.handler';
import { GetNodeByUuidHandler } from './get-node-by-uuid';
import { GetNodeIdByUuidHandler } from './get-node-id-by-uuid';
import { GetNodesByCriteriaHandler } from './get-nodes-by-criteria';
import { GetNodesByPluginUuidHandler } from './get-nodes-by-plugin-uuid';
import { GetNodesRecapHandler } from './get-nodes-recap';
import { GetNodesSystemStatsHandler } from './get-nodes-system-stats';
import { GetOnlineNodesHandler } from './get-online-nodes';
import { GetProfileUuidsByIntegrationUuidHandler } from './get-profile-uuids-by-integration-uuid';

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
    GetProfileUuidsByIntegrationUuidHandler,
    GetNodeIdByUuidHandler,
    GetNodesRecapHandler,
    GetNodesSystemStatsHandler,
];
