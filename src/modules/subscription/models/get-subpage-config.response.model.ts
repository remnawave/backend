export class GetSubpageConfigResponseModel {
    public readonly subpageConfigUuid: string | null;
    public readonly webpageAllowed: boolean;

    constructor(data: GetSubpageConfigResponseModel) {
        this.subpageConfigUuid = data.subpageConfigUuid;
        this.webpageAllowed = data.webpageAllowed;
    }
}
