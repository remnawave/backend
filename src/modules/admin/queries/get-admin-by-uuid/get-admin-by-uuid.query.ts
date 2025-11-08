import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { AdminEntity } from '@modules/admin/entities/admin.entity';

export class GetAdminByUuidQuery extends Query<ICommandResponse<AdminEntity>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
