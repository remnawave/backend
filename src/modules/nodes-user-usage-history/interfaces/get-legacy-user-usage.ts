export interface IGetLegacyStatsUserUsage {
    userUuid: string;
    nodeUuid: string;
    nodeName: string;
    countryCode: string;
    total: bigint;
    date: string;
}
