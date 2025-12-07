import { Prisma } from '@prisma/client';

import { NodesUserUsageHistoryEntity } from '@modules/nodes-user-usage-history/entities';

export class BulkUpsertHistoryEntryBuilder {
    public query: Prisma.Sql;

    constructor(usageHistoryList: NodesUserUsageHistoryEntity[]) {
        this.query = this.getQuery(usageHistoryList);
        return this;
    }

    private getQuery(usageHistoryList: NodesUserUsageHistoryEntity[]): Prisma.Sql {
        const values = Prisma.join(
            usageHistoryList.map(
                (h) =>
                    Prisma.sql`(${h.nodeId}, ${h.userId}, ${h.totalBytes}, (NOW() AT TIME ZONE 'UTC')::date, NOW())`,
            ),
        );

        return Prisma.sql`
            INSERT INTO nodes_user_usage_history (
                node_id,
                user_id,
                total_bytes,
                created_at,
                updated_at
            )
            SELECT 
                v.node_id,
                v.user_id,
                v.total_bytes,
                v.created_at,
                v.updated_at
            FROM (
                VALUES ${values}
            ) AS v(node_id, user_id, total_bytes, created_at, updated_at)
            INNER JOIN nodes n ON n.id = v.node_id
            INNER JOIN users u ON u.t_id = v.user_id
            ON CONFLICT ON CONSTRAINT nodes_user_usage_history_pkey
            DO UPDATE SET
                total_bytes = nodes_user_usage_history.total_bytes + EXCLUDED.total_bytes,
                updated_at  = EXCLUDED.updated_at
        `;
    }
}
