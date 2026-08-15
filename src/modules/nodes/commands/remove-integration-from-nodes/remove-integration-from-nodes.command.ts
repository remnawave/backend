import { Command } from '@nestjs/cqrs';

import { TResult } from '@common/types';

export class RemoveIntegrationFromNodesCommand extends Command<TResult<boolean>> {
    constructor(public readonly integrationUuid: string) {
        super();
    }
}
