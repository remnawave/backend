import { Query } from '@nestjs/cqrs';

import { TResult } from '@common/types';

import { AdminEntity } from '@modules/admin/entities/admin.entity';

export class GetAdminByUuidQuery extends Query<TResult<AdminEntity>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
