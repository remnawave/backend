interface IGetRecapResponseData {
    thisMonth: {
        users: number;
        traffic: string;
    };
    total: {
        users: number;
        nodes: number;
        traffic: string;
        nodesRam: string;
        nodesCpuCores: number;
        distinctCountries: number;
    };
    version: string;
    initDate: Date;
}

export class GetRecapResponseModel {
    thisMonth: {
        users: number;
        traffic: string;
    };
    total: {
        users: number;
        nodes: number;
        traffic: string;
        nodesRam: string;
        nodesCpuCores: number;
        distinctCountries: number;
    };
    version: string;
    initDate: Date;

    constructor(data: IGetRecapResponseData) {
        this.thisMonth = data.thisMonth;
        this.total = data.total;
        this.version = data.version;
        this.initDate = data.initDate;
    }
}
