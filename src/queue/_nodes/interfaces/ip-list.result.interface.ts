export interface IGetIpsListProgress {
    total: number;
    completed: number;
    percent: number;
}

export interface IGetIpsListNodeResult {
    nodeUuid: string;
    nodeName: string;
    countryCode: string;
    ips: { ip: string; lastSeen: Date }[];
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

export interface IGetUserIpListItem {
    userId: string;
    ips: { ip: string; lastSeen: Date }[];
}

export interface IGetUsersIpsListResult {
    isCompleted: boolean;
    isFailed: boolean;
    result: {
        success: boolean;
        nodeUuid: string;
        users: IGetUserIpListItem[];
    } | null;
}
