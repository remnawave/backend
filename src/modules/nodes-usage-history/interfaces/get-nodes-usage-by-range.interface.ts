export interface IGetNodesUsageByRange {
    uuid: string;
    name: string;
    countryCode: string;
    total: bigint;
    data: bigint[];
}

export interface ITopNode {
    uuid: string;
    name: string;
    countryCode: string;
    total: bigint;
}
