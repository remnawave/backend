import { Prisma } from '@prisma/client';

import { TResetPeriods } from '@libs/contracts/constants';
import { USERS_STATUS } from '@libs/contracts/constants';

export class BatchResetLimitedUsersUsageBuilder {
    public query: Prisma.Sql;

    constructor(strategy: TResetPeriods) {
        this.query = this.getQuery(strategy);
        return this;
    }

    public getQuery(strategy: TResetPeriods): Prisma.Sql {
        const limited = USERS_STATUS.LIMITED.toUpperCase();
        const active = USERS_STATUS.ACTIVE.toUpperCase();
        const strat = strategy.toUpperCase();

        const query = Prisma.sql`
      WITH users_to_reset AS (
        SELECT u.uuid,
               u.t_id,
               ut.used_traffic_bytes
        FROM users u
        INNER JOIN user_traffic ut ON ut.t_id = u.t_id
        WHERE u.traffic_limit_strategy = ${strat}
          AND u.status = ${limited}
      ),
      insert_history AS (
        INSERT INTO user_traffic_history (user_uuid, used_bytes)
        SELECT uuid, used_traffic_bytes
        FROM users_to_reset
      ),
      update_users AS (
        UPDATE users u
        SET last_traffic_reset_at = NOW(),
            last_triggered_threshold = 0,
            status = ${active}
        WHERE u.uuid IN (SELECT uuid FROM users_to_reset)
        RETURNING u.uuid, u.t_id
      ),
      update_traffic AS (
        UPDATE user_traffic ut
        SET used_traffic_bytes = 0
        FROM update_users uu
        WHERE ut.t_id = uu.t_id
      )
      SELECT uuid FROM update_users;
    `;

        return query;
    }
}
