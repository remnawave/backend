import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { NodeMetadataConverter } from '../converters';
import { NodeMetadataEntity } from '../entities';

@Injectable()
export class NodeMetadataRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly nodeMetadataConverter: NodeMetadataConverter,
    ) {}

    public async upsert(entity: NodeMetadataEntity): Promise<NodeMetadataEntity> {
        const result = await this.prisma.tx.nodeMeta.upsert({
            where: {
                nodeId: entity.nodeId,
            },
            update: entity,
            create: entity,
        });

        return this.nodeMetadataConverter.fromPrismaModelToEntity(result);
    }

    public async getByNodeId(nodeId: bigint): Promise<NodeMetadataEntity | null> {
        const result = await this.prisma.tx.nodeMeta.findUnique({
            where: { nodeId },
        });
        if (!result) {
            return null;
        }
        return this.nodeMetadataConverter.fromPrismaModelToEntity(result);
    }
}
