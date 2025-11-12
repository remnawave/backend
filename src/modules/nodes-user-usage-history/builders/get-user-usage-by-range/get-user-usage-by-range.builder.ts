import { Prisma } from '@prisma/client';

export class GetUserUsageByRangeBuilder {
    public query: Prisma.Sql;

    constructor(userId: bigint, start: Date, end: Date) {
        this.query = this.getQuery(userId, start, end);
        return this;
    }

    public getQuery(userId: bigint, start: Date, end: Date): Prisma.Sql {
        return Prisma.sql`
            SELECT
                DATE(h.created_at) AS "date",
                u.uuid as "userUuid",
                n.uuid as "nodeUuid",
                n.name AS "nodeName",
                n.country_code AS "countryCode",
                COALESCE(SUM(h.total_bytes), 0) AS "total"
            FROM
                nodes_user_usage_history h
                JOIN nodes n ON h.node_id = n.id
                JOIN users u ON h.user_id = u.t_id
            WHERE
                h.user_id = ${userId}
                AND h.created_at >= ${start}
                AND h.created_at <= ${end}
            GROUP BY
                "date",
                u.uuid,
                n.uuid,
                n.name,
                n.country_code
            ORDER BY
                "date" ASC
        `;
    }
}
