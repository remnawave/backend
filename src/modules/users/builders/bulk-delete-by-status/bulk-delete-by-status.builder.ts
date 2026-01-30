import { Prisma } from '@generated/prisma/client';

import { TUsersStatus } from '@libs/contracts/constants';

export class BulkDeleteByStatusBuilder {
    public query: Prisma.Sql;

    constructor(status: TUsersStatus, limit: number = 30000) {
        this.query = this.getQuery(status, limit);
        return this;
    }

    public getQuery(status: TUsersStatus, limit: number): Prisma.Sql {
        const query = `
        DELETE FROM users
        WHERE "t_id" IN (
            SELECT "t_id" FROM users 
            WHERE "status" = '${status}' 
            LIMIT ${limit}
        );
    `;
        return Prisma.raw(query);
    }
}
