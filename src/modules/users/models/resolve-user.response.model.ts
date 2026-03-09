export class ResolveUserResponseModel {
    public readonly uuid: string;
    public readonly id: number;
    public readonly shortUuid: string;
    public readonly username: string;

    constructor(data: ResolveUserResponseModel) {
        this.uuid = data.uuid;
        this.id = data.id;
        this.shortUuid = data.shortUuid;
        this.username = data.username;
    }
}
