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
  WITH update_users AS (
    UPDATE users
    SET last_traffic_reset_at = NOW(),
        last_triggered_threshold = 0,
        status = ${active}
    WHERE traffic_limit_strategy = ${strat}
      AND status = ${limited}
    RETURNING t_id
  )
  UPDATE user_traffic ut
  SET used_traffic_bytes = 0
  FROM update_users uu
  WHERE ut.t_id = uu.t_id
  RETURNING ut.t_id;
    `;

        return query;
    }
}
