import { Prisma } from '@prisma/client';

export class BulkUpdateUserUsedTrafficBuilder {
    public query: Prisma.Sql;

    constructor(list: { u: string; b: string; n: string }[]) {
        this.query = this.getQuery(list);
        return this;
    }

    public getQuery(list: { u: string; b: string; n: string }[]): Prisma.Sql {
        if (list.length === 0) {
            return Prisma.sql`SELECT NULL::uuid AS "tId" WHERE FALSE`;
        }

        const values = Prisma.join(
            list.map((h) => Prisma.sql`(${h.b}::bigint, ${h.u}::bigint, ${h.n}::uuid)`),
        );

        return Prisma.sql`
WITH data("inc_used","t_id","last_connected_node_uuid") AS (
  VALUES ${values}
),
locked AS (
  SELECT u."t_id"
  FROM "user_traffic" u
  JOIN data d ON d."t_id" = u."t_id"
  ORDER BY u."t_id"
  FOR UPDATE
),
updated_users AS (
  UPDATE "user_traffic" AS u
  SET
    "used_traffic_bytes"          = u."used_traffic_bytes" + d."inc_used",
    "lifetime_used_traffic_bytes" = u."lifetime_used_traffic_bytes" + d."inc_used",
    "online_at"                   = NOW(),
    "first_connected_at"          = COALESCE(u."first_connected_at", NOW()),
    "last_connected_node_uuid"    = d."last_connected_node_uuid"
  FROM data d
  JOIN locked l ON l."t_id" = d."t_id"
  WHERE d."t_id" = u."t_id"
  RETURNING
    u."t_id",
    (u."first_connected_at" = u."online_at") AS "isFirstConnection"
)
SELECT "t_id" AS "tId"
FROM updated_users
WHERE "isFirstConnection";
    `;
    }
}
