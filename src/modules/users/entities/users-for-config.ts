export class UserForConfigEntity {
    public trojanPassword: string;
    public vlessUuid: string;
    public ssPassword: string;
    public tags: string[];
    public tId: bigint;

    constructor(data: UserForConfigEntity) {
        this.trojanPassword = data.trojanPassword;
        this.vlessUuid = data.vlessUuid;
        this.ssPassword = data.ssPassword;
        this.tags = data.tags;
        this.tId = data.tId;
    }
}
