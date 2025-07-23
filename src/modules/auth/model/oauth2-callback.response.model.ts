export class OAuth2CallbackResponseModel {
    public readonly accessToken: string;

    constructor(data: OAuth2CallbackResponseModel) {
        this.accessToken = data.accessToken;
    }
}
