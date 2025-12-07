import { RemoveUserCommand } from '@remnawave/node-contract';

export interface IRemoveUserFromNodePayload {
    data: RemoveUserCommand.Request;
    node: {
        address: string;
        port: number | null;
    };
}
