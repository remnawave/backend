export class ConnectionKeysResponseModel {
    public enabledKeys: string[];
    public hiddenKeys: string[];
    public disabledKeys: string[];

    constructor(data: ConnectionKeysResponseModel) {
        this.enabledKeys = data.enabledKeys;
        this.hiddenKeys = data.hiddenKeys;
        this.disabledKeys = data.disabledKeys;
    }
}
