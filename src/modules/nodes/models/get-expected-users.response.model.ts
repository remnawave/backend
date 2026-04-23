import { ExpectedUserRow } from '../repositories/nodes.repository';

export class GetExpectedUsersResponseModel {
    public nodeUuid: string;
    public users: ExpectedUserRow[];

    constructor(nodeUuid: string, users: ExpectedUserRow[]) {
        this.nodeUuid = nodeUuid;
        this.users = users;
    }
}
