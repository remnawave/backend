import { AddUsersCommand as AddUsersToNodeCommandSdk } from '@remnawave/node-contract';

export interface IAddUsersToNodePayload {
    data: AddUsersToNodeCommandSdk.Request;
    node: {
        address: string;
        port: number | null;
    };
}
