export class GetAllNodesTagsResponseModel {
    public readonly tags: string[];

    constructor(data: string[]) {
        this.tags = data;
    }
}
