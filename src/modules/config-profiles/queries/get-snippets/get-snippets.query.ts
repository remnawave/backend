import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { SnippetEntity } from '@modules/config-profiles/entities';

export class GetSnippetsQuery extends Query<ICommandResponse<SnippetEntity[]>> {
    constructor() {
        super();
    }
}
