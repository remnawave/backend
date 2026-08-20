import { GetGeocheckCommand } from '@remnawave/node-contract';

export interface IGeocheckPayload {
    nodeUuid: string;
    ip?: string;
    interface?: string;
}

export type TGeocheckImage = GetGeocheckCommand.Response['response']['image'];

export interface IGeocheckJobResult {
    success: boolean;
    nodeUuid: string;
    image: TGeocheckImage | null;
    rawReport: Record<string, unknown> | null;
    message: string | null;
}

export interface IGeocheckResult {
    isCompleted: boolean;
    isFailed: boolean;
    result: IGeocheckJobResult | null;
}
