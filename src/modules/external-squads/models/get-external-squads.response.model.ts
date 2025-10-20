import { GetExternalSquadByUuidResponseModel } from './get-external-squad-by-uuid.response.model';
import { ExternalSquadWithInfoEntity } from '../entities';

export class GetExternalSquadsResponseModel {
    public readonly total: number;
    public readonly externalSquads: GetExternalSquadByUuidResponseModel[];

    constructor(entities: ExternalSquadWithInfoEntity[], total: number) {
        this.total = total;
        this.externalSquads = entities.map(
            (internalSquad) => new GetExternalSquadByUuidResponseModel(internalSquad),
        );
    }
}
