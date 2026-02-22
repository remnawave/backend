import { DropUsersConnectionsCommand } from '@remnawave/node-contract';

export interface IDropUsersConnectionsPayload {
    data: DropUsersConnectionsCommand.Request;
    node: {
        address: string;
        port: number | null;
    };
}
