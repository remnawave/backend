export interface ActualUserRow {
    username: string;
    inboundTags: string[];
}

export class GetActualUsersResponseModel {
    public nodeUuid: string;
    public users: ActualUserRow[];
    public unreachableTags: string[];

    constructor(nodeUuid: string, users: ActualUserRow[], unreachableTags: string[]) {
        this.nodeUuid = nodeUuid;
        this.users = users;
        this.unreachableTags = unreachableTags;
    }
}
