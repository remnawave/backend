import { colorFromUuid } from '@kastov/uuid-color';

import { IGetNodesUsageByRange, ITopNode } from '../interfaces';

export class GetStatsNodesUsageResponseModel {
    public readonly categories: string[];
    public readonly series: {
        uuid: string;
        name: string;
        color: string;
        countryCode: string;
        total: number;
        data: number[];
    }[];
    public readonly sparklineData: number[];
    public readonly topNodes: {
        uuid: string;
        name: string;
        color: string;
        countryCode: string;
        total: number;
    }[];

    constructor(data: {
        categories: string[];
        series: IGetNodesUsageByRange[];
        sparklineData: number[];
        topNodes: ITopNode[];
    }) {
        this.categories = data.categories;
        this.series = data.series.map((item) => ({
            uuid: item.uuid,
            name: item.name,
            color: colorFromUuid(item.uuid),
            countryCode: item.countryCode,
            total: Number(item.total),
            data: item.data.map((item) => Number(item)),
        }));
        this.sparklineData = data.sparklineData;
        this.topNodes = data.topNodes.map((item) => ({
            uuid: item.uuid,
            name: item.name,
            color: colorFromUuid(item.uuid),
            countryCode: item.countryCode,
            total: Number(item.total),
        }));
    }
}
