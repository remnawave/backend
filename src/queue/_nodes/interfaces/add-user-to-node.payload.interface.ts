import { AddUserCommand as AddUserToNodeCommandSdk } from '@remnawave/node-contract';

export interface IAddUserToNodePayload {
    data: AddUserToNodeCommandSdk.Request;
    node: {
        address: string;
        port: number | null;
    };
}
