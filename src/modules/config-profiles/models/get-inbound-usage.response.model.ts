export class GetInboundUsageResponseModel {
    public readonly inboundUuid: string;
    public readonly onlineByNode: { nodeUuid: string; count: number }[];
    public readonly users: {
        id: number;
        totalBytes: number;
    }[];
    public readonly nextCursor: string | null;
    public readonly hasMore: boolean;

    constructor(data: GetInboundUsageResponseModel) {
        this.inboundUuid = data.inboundUuid;
        this.onlineByNode = data.onlineByNode;
        this.users = data.users;
        this.nextCursor = data.nextCursor;
        this.hasMore = data.hasMore;
    }
}
