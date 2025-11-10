import { Prisma } from '@prisma/client';

export class BulkUpdateUserUsedTrafficBuilder {
    public query: Prisma.Sql;

    constructor(userUsageList: { u: string; b: string; n: string }[]) {
        this.query = this.getQuery(userUsageList);
        return this;
    }

    public getQuery(userUsageList: { u: string; b: string; n: string }[]): Prisma.Sql {
        const query = `
        WITH sorted_data AS (
            SELECT * FROM (
                VALUES ${userUsageList.map((h) => `(${h.b}, ${h.u}, '${h.n}'::uuid)`).join(',')}
            ) AS data("inc_used", "t_id", "last_connected_node_uuid")
            ORDER BY "t_id"
        ),
        updated_users AS (
            UPDATE "users" AS u
            SET
                "used_traffic_bytes" = u."used_traffic_bytes" + sorted_data."inc_used",
                "lifetime_used_traffic_bytes" = u."lifetime_used_traffic_bytes" + sorted_data."inc_used",
                "online_at" = NOW(),
                "first_connected_at" = COALESCE(u."first_connected_at", NOW()),
                "updated_at" = NOW(),
                "last_connected_node_uuid" = sorted_data."last_connected_node_uuid"
            FROM sorted_data
            WHERE sorted_data."t_id" = u."t_id"
            RETURNING u."uuid", (u."first_connected_at" = u."online_at") AS "isFirstConnection"
        )
        SELECT uuid FROM updated_users WHERE "isFirstConnection";
    `;
        return Prisma.raw(query);
    }
}
