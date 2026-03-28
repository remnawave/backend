import { INodeSystem } from './node-host-info.interface';

export interface INodeVersions {
    xray: string;
    node: string;
}

export interface INodeHotCache {
    system: INodeSystem | null;
    versions: INodeVersions | null;
    xrayUptime: number;
    onlineUsers: number;
}
