import { TruncateNodesUserUsageHistoryHandler } from './truncate-nodes-user-usage-history';
import { VacuumNodesUserUsageHistoryHandler } from './vacuum-nodes-user-usage-history';
import { BulkUpsertUserHistoryEntryHandler } from './bulk-upsert-user-history-entry';

export const COMMANDS = [
    BulkUpsertUserHistoryEntryHandler,
    VacuumNodesUserUsageHistoryHandler,
    TruncateNodesUserUsageHistoryHandler,
];
