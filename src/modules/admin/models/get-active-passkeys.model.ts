export class GetActivePasskeysResponseModel {
    public readonly passkeys: {
        id: string;
        name: string;
        createdAt: Date;
        lastUsedAt: Date;
    }[];

    constructor(data: GetActivePasskeysResponseModel) {
        this.passkeys = data.passkeys;
    }
}
