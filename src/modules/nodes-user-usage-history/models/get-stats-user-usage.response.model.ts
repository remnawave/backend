import { colorFromUuid } from '@kastov/uuid-color';

import {
    IGetUniversalSeries,
    IGetUniversalSeriesConverted,
    IGetUniversalTopNode,
    IGetUniversalTopNodeConverted,
} from '../interfaces';

export class GetStatsUserUsageResponseModel {
    public readonly categories: string[];
    public readonly series: IGetUniversalSeriesConverted[];
    public readonly sparklineData: number[];
    public readonly topNodes: IGetUniversalTopNodeConverted[];

    constructor(data: {
        categories: string[];
        series: IGetUniversalSeries[];
        sparklineData: number[];
        topNodes: IGetUniversalTopNode[];
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
