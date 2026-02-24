import { DropIpsCommand } from '@remnawave/node-contract';

export interface IDropIpsConnectionsPayload {
    data: DropIpsCommand.Request;
    node: {
        address: string;
        port: number | null;
    };
}
