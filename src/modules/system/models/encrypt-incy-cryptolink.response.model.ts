export class EncryptIncyCryptoLinkResponseModel {
    encryptedLink: string;

    constructor(data: string) {
        this.encryptedLink = data;
    }
}
