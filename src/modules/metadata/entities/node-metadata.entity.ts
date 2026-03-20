import { NodeMeta } from '@prisma/client';

export class NodeMetadataEntity implements NodeMeta {
    public nodeId: bigint;
    public metadata: Record<string, unknown>;

    constructor(nodeMetadata: Partial<NodeMeta>) {
        Object.assign(this, nodeMetadata);
        return this;
    }
}
