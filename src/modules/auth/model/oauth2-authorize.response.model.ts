export class OAuth2AuthorizeResponseModel {
    public readonly authorizationUrl: string;

    constructor(data: OAuth2AuthorizeResponseModel) {
        this.authorizationUrl = data.authorizationUrl;
    }
}
