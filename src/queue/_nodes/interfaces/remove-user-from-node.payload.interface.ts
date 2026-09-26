import { RemoveUserCommand } from '@remnawave/node-contract';

import { INodeConnectionOpts } from '@common/axios';

export interface IRemoveUserFromNodePayload {
    data: RemoveUserCommand.Request;
    node: INodeConnectionOpts;
    cleanupInbounds: { uuid: string; tag: string }[];
}
