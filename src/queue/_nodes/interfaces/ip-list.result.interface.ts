export interface IGetIpsListProgress {
    total: number;
    completed: number;
    percent: number;
}

export interface IGetIpsListNodeResult {
    nodeUuid: string;
    nodeName: string;
    countryCode: string;
    ips: string[];
}

export interface IGetIpsListResult {
    isCompleted: boolean;
    isFailed: boolean;
    progress: IGetIpsListProgress;
    result: {
        success: boolean;
        userUuid: string;
        userId: string;
        nodes: IGetIpsListNodeResult[];
    } | null;
}
