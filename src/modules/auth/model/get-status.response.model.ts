import { TOAuth2ProvidersKeys } from '@libs/contracts/constants';

interface IAuthentication {
    passkey: {
        enabled: boolean;
    };
    oauth2: {
        providers: Record<TOAuth2ProvidersKeys, boolean>;
    };
    password: {
        enabled: boolean;
    };
}

export class GetStatusResponseModel {
    public readonly isLoginAllowed: boolean;
    public readonly isRegisterAllowed: boolean;
    public readonly authentication: IAuthentication | null;
    public readonly branding: {
        title: string | null;
        logoUrl: string | null;
    };

    constructor(data: {
        isLoginAllowed: boolean;
        isRegisterAllowed: boolean;
        authentication: IAuthentication | null;
        branding: {
            title: string | null;
            logoUrl: string | null;
        };
    }) {
        this.isLoginAllowed = data.isLoginAllowed;
        this.isRegisterAllowed = data.isRegisterAllowed;
        this.authentication = data.authentication;
        this.branding = data.branding;
    }
}
