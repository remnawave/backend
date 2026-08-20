import { ISharedListPreview } from '../interfaces/shared-list-preview.interface';

export class SharedListPreviewResponseModel {
    public name: string;
    public type: string;
    public itemsCount: number;

    constructor(preview: ISharedListPreview) {
        this.name = preview.name;
        this.type = preview.type;
        this.itemsCount = preview.itemsCount;
    }
}
