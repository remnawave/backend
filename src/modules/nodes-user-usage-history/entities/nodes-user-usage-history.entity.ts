import { NodesUserUsageHistory } from '@prisma/client';

export class NodesUserUsageHistoryEntity implements NodesUserUsageHistory {
    nodeId: bigint;
    userId: bigint;
    totalBytes: bigint;
    createdAt: Date;
    updatedAt: Date;

    constructor(history: Partial<NodesUserUsageHistory>) {
        Object.assign(this, history);
        return this;
    }
}
