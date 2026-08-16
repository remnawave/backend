import { ISharedListPreview } from '../interfaces/shared-list-preview.interface';
import { SharedListPreviewResponseModel } from './shared-list-preview.response.model';

export class GetSharedListsResponseModel {
    public readonly total: number;
    public readonly sharedLists: SharedListPreviewResponseModel[];

    constructor(previews: ISharedListPreview[], total: number) {
        this.total = total;
        this.sharedLists = previews.map((preview) => new SharedListPreviewResponseModel(preview));
    }
}
