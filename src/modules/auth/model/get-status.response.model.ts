export class GetStatusResponseModel {
    public readonly isLoginAllowed: boolean;
    public readonly isRegisterAllowed: boolean;
    public readonly tgAuth: {
        botId: number;
    } | null;

    constructor(data: {
        isLoginAllowed: boolean;
        isRegisterAllowed: boolean;
        tgAuth: {
            botId: number;
        } | null;
    }) {
        this.isLoginAllowed = data.isLoginAllowed;
        this.isRegisterAllowed = data.isRegisterAllowed;
        this.tgAuth = data.tgAuth;
    }
}
