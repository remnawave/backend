import { Prisma } from '@prisma/client';

export class BulkUpdateUserUsedTrafficBuilder {
    public query: Prisma.Sql;

    constructor(userUsageList: { u: string; b: string; n: string }[]) {
        this.query = this.getQuery(userUsageList);
        return this;
    }

    public getQuery(userUsageList: { u: string; b: string; n: string }[]): Prisma.Sql {
        const values = Prisma.join(
            userUsageList.map((h) => Prisma.sql`(${h.b}::bigint, ${h.u}::bigint, ${h.n}::uuid)`),
        );

        const query = Prisma.sql`
        WITH updated_users AS ( UPDATE "users" AS u
            SET
                "used_traffic_bytes"          = u."used_traffic_bytes" + data."inc_used",
                "lifetime_used_traffic_bytes" = u."lifetime_used_traffic_bytes" + data."inc_used",
                "online_at"                   = NOW(),
                "first_connected_at"          = COALESCE(u."first_connected_at", NOW()),
                "last_connected_node_uuid"   = data."last_connected_node_uuid"
        FROM (
            VALUES ${values}
            ) AS data("inc_used", "t_id", "last_connected_node_uuid")
        WHERE data."t_id" = u."t_id"
        RETURNING
            u."t_id",
            (u."first_connected_at" = u."online_at") AS "isFirstConnection"
        )
        SELECT t_id as "tId"
        FROM updated_users
        WHERE "isFirstConnection";
    `;
        return query;
    }
}
