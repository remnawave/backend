export class GetInboundUserUsageResponseModel {
    public readonly days: { date: string; totalBytes: number }[];

    constructor(data: GetInboundUserUsageResponseModel) {
        this.days = data.days;
    }
}
