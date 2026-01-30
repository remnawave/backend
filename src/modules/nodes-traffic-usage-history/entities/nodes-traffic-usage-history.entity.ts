import type { NodesTrafficUsageHistoryModel as NodesTrafficUsageHistory } from '@generated/prisma/models';

export class NodesTrafficUsageHistoryEntity implements NodesTrafficUsageHistory {
    id: bigint;
    nodeUuid: string;
    trafficBytes: bigint;
    resetAt: Date;

    constructor(history: Partial<NodesTrafficUsageHistory>) {
        Object.assign(this, history);
        return this;
    }
}
