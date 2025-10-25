import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { PasskeyEntity } from '@modules/admin/entities/passkey.entity';

export class GetPasskeysByAdminUuidQuery extends Query<ICommandResponse<PasskeyEntity[]>> {
    constructor(public readonly adminUuid: string) {
        super();
    }
}
