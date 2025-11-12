import { TruncateNodesUserUsageHistoryHandler } from './truncate-nodes-user-usage-history';
import { VacuumNodesUserUsageHistoryHandler } from './vacuum-nodes-user-usage-history';
import { BulkUpsertUserHistoryEntryHandler } from './bulk-upsert-user-history-entry';
import { CleanOldUsageRecordsHandler } from './clean-old-usage-records';

export const COMMANDS = [
    BulkUpsertUserHistoryEntryHandler,
    VacuumNodesUserUsageHistoryHandler,
    CleanOldUsageRecordsHandler,
    TruncateNodesUserUsageHistoryHandler,
];
