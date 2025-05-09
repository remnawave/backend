export class GetAllTagsResponseModel {
    public readonly tags: string[];

    constructor(data: GetAllTagsResponseModel) {
        this.tags = data.tags;
    }
}
