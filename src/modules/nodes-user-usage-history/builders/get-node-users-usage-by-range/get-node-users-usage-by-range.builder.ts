import { Prisma } from '@generated/prisma/client';

export class GetNodeUsersUsageByRangeBuilder {
    public query: Prisma.Sql;

    constructor(nodeId: bigint, start: Date, end: Date) {
        this.query = this.getQuery(nodeId, start, end);
        return this;
    }

    public getQuery(nodeId: bigint, start: Date, end: Date): Prisma.Sql {
        return Prisma.sql`
        SELECT
            DATE(h.created_at) AS "date",
            n.uuid as "nodeUuid",
            u.uuid as "userUuid",
            u.username as "username",
            COALESCE(SUM(h.total_bytes), 0) AS "total"
        FROM
            nodes_user_usage_history h
            JOIN users u ON h.user_id = u.t_id
            JOIN nodes n ON h.node_id = n.id
        WHERE
            h.node_id = ${nodeId}
            AND h.created_at >= ${start}
            AND h.created_at <= ${end}
        GROUP BY
            "date",
            n.uuid,
            u.uuid,
            u.username
        ORDER BY
            "date" ASC
    `;
    }
}
