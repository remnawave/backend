export interface IGetUniversalSeries {
    uuid: string;
    name: string;
    countryCode: string;
    total: bigint;
    data: bigint[];
}

export interface IGetUniversalTopNode {
    uuid: string;
    name: string;
    countryCode: string;
    total: bigint;
}

export interface IGetUniversalSeriesConverted {
    uuid: string;
    name: string;
    color: string;
    countryCode: string;
    total: number;
    data: number[];
}

export interface IGetUniversalTopNodeConverted {
    uuid: string;
    color: string;
    name: string;
    countryCode: string;
    total: number;
}
