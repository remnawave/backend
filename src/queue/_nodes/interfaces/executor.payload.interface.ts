import { BlockIpsCommand, UnblockIpsCommand } from '@remnawave/node-contract';

export interface IBlockIpsPayload {
    data: BlockIpsCommand.Request;
    node: {
        address: string;
        port: number | null;
    };
}

export interface IUnblockIpsPayload {
    data: UnblockIpsCommand.Request;
    node: {
        address: string;
        port: number | null;
    };
}

export interface IRecreateTablesPayload {
    node: {
        address: string;
        port: number | null;
    };
}
