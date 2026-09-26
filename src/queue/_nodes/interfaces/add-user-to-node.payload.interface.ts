import { AddUserCommand as AddUserToNodeCommandSdk } from '@remnawave/node-contract';

import { INodeConnectionOpts } from '@common/axios';

export interface IAddUserToNodePayload {
    data: AddUserToNodeCommandSdk.Request;
    node: INodeConnectionOpts;
    cleanupInbounds: { uuid: string; tag: string }[];
}
