import { FindUsersForThresholdNotificationTask } from './find-users-for-threshold-notification';
import { FindNotConnectedUsersNotificationTask } from './find-not-connected-users-notification';
import { FindUsersForExpireNotificationsTask } from './find-users-for-expire-notifications';
import { FindExceededUsageUsersTask } from './find-exceeded-usage-users';
import { FindExpiredUsersTask } from './find-expired-users';

export const USERS_JOBS_TASKS = [
    FindExceededUsageUsersTask,
    FindExpiredUsersTask,
    FindUsersForExpireNotificationsTask,
    FindUsersForThresholdNotificationTask,
    FindNotConnectedUsersNotificationTask,
];
