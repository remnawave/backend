import { SharedListEntity } from '../entities/shared-list.entity';

export class BaseSharedListResponseModel {
    public name: string;
    public config: Record<string, unknown>;

    constructor(entity: SharedListEntity) {
        this.name = entity.name;
        this.config = entity.config as Record<string, unknown>;
    }
}
