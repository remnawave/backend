import type { NodesUsageHistoryModel as NodesUsageHistory } from '@generated/prisma/models';

export class NodesUsageHistoryEntity implements NodesUsageHistory {
    public nodeUuid: string;
    public downloadBytes: bigint;
    public uploadBytes: bigint;
    public totalBytes: bigint;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(history: Partial<NodesUsageHistory>) {
        Object.assign(this, history);
        return this;
    }
}
