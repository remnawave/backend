import { RemoveUsersCommand } from '@remnawave/node-contract';

import { INodeConnectionOpts } from '@common/axios';

export interface IRemoveUsersFromNodePayload {
    data: RemoveUsersCommand.Request;
    node: INodeConnectionOpts;
    cleanupInbounds: { uuid: string; tag: string }[];
}
