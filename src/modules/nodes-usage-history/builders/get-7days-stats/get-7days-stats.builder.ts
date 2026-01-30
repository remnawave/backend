import { Prisma } from '@generated/prisma/client';

export class Get7DaysStatsBuilder {
    public query: Prisma.Sql;

    constructor() {
        this.query = this.getQuery();
        return this;
    }

    public getQuery(): Prisma.Sql {
        const query = `
            SELECT
                n.name as "nodeName",
                COALESCE(SUM(nu.total_bytes), 0) AS "totalBytes",
                DATE_TRUNC('day', nu.created_at)::date AS "date"
            FROM
                nodes_usage_history AS nu
            JOIN
                nodes AS n ON nu.node_uuid = n.uuid
            WHERE
                nu.created_at >= NOW() - INTERVAL '7 days'
            GROUP BY
                n.name, DATE_TRUNC('day', nu.created_at)::date
            ORDER BY
                "date" ASC
        `;

        return Prisma.raw(query);
    }
}
