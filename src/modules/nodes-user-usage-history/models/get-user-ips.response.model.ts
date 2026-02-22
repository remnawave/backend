import {
    IGetIpsListNodeResult,
    IGetIpsListProgress,
    IGetIpsListResult,
} from '@queue/_nodes/interfaces';

export class CreateUserIpsJobResponseModel {
    public readonly jobId: string;

    constructor(data: { jobId: string }) {
        this.jobId = data.jobId;
    }
}

export class GetUserIpsResultResponseModel {
    public readonly isCompleted: boolean;
    public readonly isFailed: boolean;
    public readonly progress: IGetIpsListProgress;
    public readonly result: {
        success: boolean;
        userUuid: string;
        userId: string;
        nodes: IGetIpsListNodeResult[];
    } | null;

    constructor(data: IGetIpsListResult) {
        this.isCompleted = data.isCompleted;
        this.isFailed = data.isFailed;
        this.progress = data.progress;
        this.result = data.result;
    }
}
