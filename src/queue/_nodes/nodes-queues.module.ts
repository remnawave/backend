import { CqrsModule } from '@nestjs/cqrs';

import { createDomainQueueModule } from '@queue/queue.factory';
import { QUEUES_NAMES } from '@queue/queue.enum';

import {
    NodeHealthCheckQueueProcessor,
    NodeUsersQueueProcessor,
    StartAllNodesByProfileQueueProcessor,
    StartNodeProcessor,
    StopNodeProcessor,
    StartAllNodesQueueProcessor,
    RecordUserUsageQueueProcessor,
    RecordNodeUsageQueueProcessor,
} from './processors';
import { StartAllNodesByProfileQueueEvents } from './events';
import { NodesQueuesService } from './nodes-queues.service';

const queues = [
    { name: QUEUES_NAMES.NODES.START, processor: StartNodeProcessor },
    { name: QUEUES_NAMES.NODES.STOP, processor: StopNodeProcessor },
    { name: QUEUES_NAMES.NODES.HEALTH_CHECK, processor: NodeHealthCheckQueueProcessor },
    { name: QUEUES_NAMES.NODES.USERS, processor: NodeUsersQueueProcessor },
    {
        name: QUEUES_NAMES.NODES.START_ALL_BY_PROFILE,
        processor: StartAllNodesByProfileQueueProcessor,
    },
    { name: QUEUES_NAMES.NODES.START_ALL_NODES, processor: StartAllNodesQueueProcessor },
    { name: QUEUES_NAMES.NODES.RECORD_USER_USAGE, processor: RecordUserUsageQueueProcessor },
    { name: QUEUES_NAMES.NODES.RECORD_NODE_USAGE, processor: RecordNodeUsageQueueProcessor },
];

export const NodesQueuesModule = createDomainQueueModule({
    queues,
    service: NodesQueuesService,
    imports: [CqrsModule],
    extraProviders: [StartAllNodesByProfileQueueEvents],
});
