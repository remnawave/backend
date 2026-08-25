import { Buffer } from 'node:buffer';

export type SignCallback = (err: Error | null, signature?: Buffer) => void;
export type IdentitiesCallback = (err: Error | null, keys?: string[]) => void;

export interface IBrowserAgentTransport {
    requestIdentities(id: number): void;
    requestSignature(id: number, publicKey: Buffer, data: Buffer, hash: null | string): void;
}

export interface IPendingRequest {
    reject: (error: Error) => void;
    resolveIdentities?: (keys: string[]) => void;
    resolveSignature?: (signature: Buffer) => void;
    timer: NodeJS.Timeout;
}
