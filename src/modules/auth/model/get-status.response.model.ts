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
    public readonly branding: {
        title: string | null;
        logoUrl: string | null;
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
        branding: {
            title: string | null;
            logoUrl: string | null;
        };
    }) {
        this.isLoginAllowed = data.isLoginAllowed;
        this.isRegisterAllowed = data.isRegisterAllowed;
        this.tgAuth = data.tgAuth;
        this.oauth2 = data.oauth2;
        this.branding = data.branding;
    }
}
