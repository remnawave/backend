import { IGetUserIpListItem, IGetUsersIpsListResult } from '@queue/_nodes/interfaces';

export class FetchUsersIpsResponseModel {
    public readonly jobId: string;

    constructor(data: { jobId: string }) {
        this.jobId = data.jobId;
    }
}

export class FetchUsersIpsResultResponseModel {
    public readonly isCompleted: boolean;
    public readonly isFailed: boolean;
    public readonly result: {
        success: boolean;
        nodeUuid: string;
        users: IGetUserIpListItem[];
    } | null;

    constructor(data: IGetUsersIpsListResult) {
        this.isCompleted = data.isCompleted;
        this.isFailed = data.isFailed;
        this.result = data.result;
    }
}
