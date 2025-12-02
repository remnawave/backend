import { CqrsModule } from '@nestjs/cqrs';

import { createDomainQueueModule } from '@queue/queue.factory';
import { QUEUES_NAMES } from '@queue/queue.enum';

import {
    UsersModifyManyQueueProcessor,
    SubscriptionRequestsQueueProcessor,
    ResetUserTrafficQueueProcessor,
    SerialUsersOperationsQueueProcessor,
    UsersWatchdogQueueProcessor,
    UpdateUsersUsageQueueProcessor,
    UserEventsQueueProcessor,
} from './processors';
import { UsersQueuesService } from './users-queues.service';

const queues = [
    { name: QUEUES_NAMES.USERS.MODIFY_MANY, processor: UsersModifyManyQueueProcessor },
    {
        name: QUEUES_NAMES.USERS.SERIAL_OPERATIONS,
        processor: SerialUsersOperationsQueueProcessor,
    },
    {
        name: QUEUES_NAMES.USERS.SUBSCRIPTION_REQUESTS,
        processor: SubscriptionRequestsQueueProcessor,
    },
    {
        name: QUEUES_NAMES.USERS.RESET_USER_TRAFFIC,
        processor: ResetUserTrafficQueueProcessor,
    },
    {
        name: QUEUES_NAMES.USERS.USERS_WATCHDOG,
        processor: UsersWatchdogQueueProcessor,
    },
    {
        name: QUEUES_NAMES.USERS.USER_EVENTS,
        processor: UserEventsQueueProcessor,
    },
    {
        name: QUEUES_NAMES.USERS.UPDATE_USERS_USAGE,
        processor: UpdateUsersUsageQueueProcessor,
    },
];

export const UsersQueuesModule = createDomainQueueModule({
    queues,
    service: UsersQueuesService,
    imports: [CqrsModule],
});
