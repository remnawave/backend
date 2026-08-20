import { IGeocheckJobResult, IGeocheckResult } from '@queue/_nodes/interfaces';

export class GeocheckByNodeResponseModel {
    public readonly jobId: string;

    constructor(data: { jobId: string }) {
        this.jobId = data.jobId;
    }
}

export class GeocheckByNodeResultResponseModel {
    public readonly isCompleted: boolean;
    public readonly isFailed: boolean;
    public readonly result: IGeocheckJobResult | null;

    constructor(data: IGeocheckResult) {
        this.isCompleted = data.isCompleted;
        this.isFailed = data.isFailed;
        this.result = data.result;
    }
}
