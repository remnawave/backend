import { AddUserCommand } from '@remnawave/node-contract';

export interface IAddUserToNodePayload {
    data: AddUserCommand.Request;
    node: {
        address: string;
        port: number | null;
    };
}
