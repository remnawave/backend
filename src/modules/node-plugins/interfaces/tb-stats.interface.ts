export interface IGetTopTorrentBlockerUser {
    uuid: string;
    username: string;
    total: bigint;
}

export interface IGetTopTorrentBlockerNode {
    uuid: string;
    name: string;
    countryCode: string;
    total: bigint;
}

export interface IGetTopTorrentBlockerNodeConverted {
    uuid: string;
    color: string;
    name: string;
    countryCode: string;
    total: number;
}

export interface IGetTopTorrentBlockerUserConverted {
    uuid: string;
    color: string;
    username: string;
    total: number;
}
