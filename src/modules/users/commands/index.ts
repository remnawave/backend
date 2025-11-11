import { UpdateSubLastOpenedAndUserAgentHandler } from './update-sub-last-opened-and-user-agent';
import { BatchResetLimitedUsersTrafficHandler } from './batch-reset-limited-users-traffic';
import { TriggerThresholdNotificationHandler } from './trigger-threshold-notification';
import { BulkIncrementUsedTrafficHandler } from './bulk-increment-used-traffic';
import { UpdateExceededTrafficUsersHandler } from './update-exceeded-users';
import { RevokeUserSubscriptionHandler } from './revoke-user-subscription';
import { BatchResetUserTrafficHandler } from './batch-reset-user-traffic';
import { UpdateUserWithServiceHandler } from './update-user-with-service';
import { BulkDeleteByStatusHandler } from './bulk-delete-by-status';
import { UpdateExpiredUsersHandler } from './update-expired-users';
import { ResetUserTrafficHandler } from './reset-user-traffic';

export const COMMANDS = [
    UpdateSubLastOpenedAndUserAgentHandler,
    BatchResetUserTrafficHandler,
    UpdateExpiredUsersHandler,
    UpdateExceededTrafficUsersHandler,
    BatchResetLimitedUsersTrafficHandler,
    BulkIncrementUsedTrafficHandler,
    RevokeUserSubscriptionHandler,
    ResetUserTrafficHandler,
    UpdateUserWithServiceHandler,
    TriggerThresholdNotificationHandler,
    BulkDeleteByStatusHandler,
];
