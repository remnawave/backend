export interface IGetUserAccessibleNodes {
    uuid: string;
    nodeName: string;
    countryCode: string;
    configProfileUuid: string;
    configProfileName: string;
    activeSquads: Map<
        string,
        {
            squadName: string;
            activeInbounds: string[];
        }
    >;
}

export interface IGetUserAccessibleNodesResponse {
    activeNodes: {
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
}
