import { Query } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';

export class GetAllNodesQuery extends Query<ICommandResponse<NodesEntity[]>> {
    constructor() {
        super();
    }
}
