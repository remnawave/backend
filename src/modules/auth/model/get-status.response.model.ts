import { TOAuth2ProvidersKeys } from '@libs/contracts/constants';

export class GetStatusResponseModel {
    public readonly isLoginAllowed: boolean;
    public readonly isRegisterAllowed: boolean;
    public readonly tgAuth: {
        botId: number;
    } | null;
    public readonly oauth2: {
        providers: Record<TOAuth2ProvidersKeys, boolean>;
    };

    constructor(data: {
        isLoginAllowed: boolean;
        isRegisterAllowed: boolean;
        tgAuth: {
            botId: number;
        } | null;
        oauth2: {
            providers: Record<TOAuth2ProvidersKeys, boolean>;
        };
    }) {
        this.isLoginAllowed = data.isLoginAllowed;
        this.isRegisterAllowed = data.isRegisterAllowed;
        this.tgAuth = data.tgAuth;
        this.oauth2 = data.oauth2;
    }
}
