import { IGetNodesRealtimeUsage } from '../interfaces';

export class GetStatsNodesRealtimeUsageResponseModel {
    public readonly nodeUuid: string;
    public readonly nodeName: string;
    public readonly countryCode: string;
    public readonly downloadBytes: number;
    public readonly uploadBytes: number;
    public readonly totalBytes: number;
    public readonly downloadSpeedBps: number;
    public readonly uploadSpeedBps: number;
    public readonly totalSpeedBps: number;

    constructor(data: IGetNodesRealtimeUsage) {
        this.nodeUuid = data.nodeUuid;
        this.nodeName = data.nodeName;
        this.countryCode = data.countryCode;
        this.downloadBytes = Number(data.downloadBytes);
        this.uploadBytes = Number(data.uploadBytes);
        this.totalBytes = Number(data.totalBytes);
        this.downloadSpeedBps = Number(data.downloadSpeedBps);
        this.uploadSpeedBps = Number(data.uploadSpeedBps);
        this.totalSpeedBps = Number(data.totalSpeedBps);
    }
}
