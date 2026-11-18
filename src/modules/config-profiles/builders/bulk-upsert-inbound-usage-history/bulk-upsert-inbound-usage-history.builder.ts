import { Prisma } from '@prisma/client';

export class BulkUpsertInboundUsageHistoryBuilder {
    public query: Prisma.Sql;

    constructor(list: { inboundUuid: string; userId: string; totalBytes: string }[]) {
        this.query = this.getQuery(list);
        return this;
    }

    private getQuery(
        list: { inboundUuid: string; userId: string; totalBytes: string }[],
    ): Prisma.Sql {
        if (list.length === 0) {
            return Prisma.sql`SELECT NULL::uuid AS "inboundUuid" WHERE FALSE`;
        }

        const sorted = [...list].sort((a, b) =>
            a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0,
        );
        const values = Prisma.join(
            sorted.map(
                (h) =>
                    Prisma.sql`(${h.inboundUuid}::uuid, ${h.userId}::bigint, ${h.totalBytes}::bigint, (NOW() AT TIME ZONE 'UTC')::date, NOW())`,
            ),
        );

        return Prisma.sql`
            INSERT INTO user_inbound_usage_history (
                inbound_uuid,
                user_id,
                total_bytes,
                created_at,
                updated_at
            )
            SELECT
                v.inbound_uuid,
                v.user_id,
                v.total_bytes,
                v.created_at,
                v.updated_at
            FROM (
                VALUES ${values}
            ) AS v(inbound_uuid, user_id, total_bytes, created_at, updated_at)
            WHERE EXISTS (SELECT 1 FROM config_profile_inbounds WHERE uuid = v.inbound_uuid)
            AND EXISTS (SELECT 1 FROM users WHERE id = v.user_id)
            ON CONFLICT ON CONSTRAINT user_inbound_usage_history_pkey
            DO UPDATE SET
                total_bytes = user_inbound_usage_history.total_bytes + EXCLUDED.total_bytes,
                updated_at  = EXCLUDED.updated_at
        `;
    }
}
