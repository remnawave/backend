import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesEntity } from '../../entities/nodes.entity';

export class GetNodeByUuidQuery extends Query<ICommandResponse<NodesEntity | null>> {
    constructor(public readonly uuid: string) {
        super();
    }
}
