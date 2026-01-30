import { Prisma } from '@generated/prisma/client';

export class TriggerThresholdNotificationsBuilder {
    public query: Prisma.Sql;

    constructor(private readonly percentages: number[]) {
        this.query = this.getQuery(this.percentages);
        return this;
    }

    public getQuery(percentages: number[]): Prisma.Sql {
        const pctValues = Prisma.join(percentages.map((p) => Prisma.sql`(${p})`));

        return Prisma.sql`
      WITH thresholds(pct) AS (VALUES ${pctValues}),
      candidates AS (
        SELECT
          u."t_id",
          MIN(u."created_at") AS created_at_for_order,
          MAX(t.pct)          AS new_threshold
        FROM "users" u
        INNER JOIN "user_traffic" ut
          ON ut."t_id" = u."t_id"
        INNER JOIN thresholds t
          ON u."status" = 'ACTIVE'
         AND u."traffic_limit_bytes" > 0
         AND ut."used_traffic_bytes" >= (u."traffic_limit_bytes" * t.pct / 100)
         AND u."last_triggered_threshold" < t.pct
        GROUP BY u."t_id"
        ORDER BY created_at_for_order
        LIMIT 5000
      )
      UPDATE "users" AS u
      SET "last_triggered_threshold" = c.new_threshold,
          "updated_at"               = NOW()
      FROM candidates c
      WHERE u."t_id" = c."t_id"
      RETURNING u."t_id" AS "tId";
    `;
    }
}
