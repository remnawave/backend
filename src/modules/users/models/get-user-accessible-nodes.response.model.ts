import { IGetUserAccessibleNodesResponse } from '../interfaces';

export class GetUserAccessibleNodesResponseModel {
    public readonly userUuid: string;
    public readonly activeNodes: {
        uuid: string;
        nodeName: string;
        countryCode: string;
        configProfileUuid: string;
        configProfileName: string;
        activeSquads: {
            squadName: string;
            activeInbounds: string[];
        }[];
    }[];

    constructor(data: IGetUserAccessibleNodesResponse, userUuid: string) {
        this.userUuid = userUuid;
        this.activeNodes = data.activeNodes;
    }
}
