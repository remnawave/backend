import { colorFromUuid } from '@kastov/uuid-color';

import { IGetUniversalTopUser, IGetUniversalTopUserConverted } from '../interfaces';

export class GetStatsNodesUsersUsageResponseModel {
    public readonly categories: string[];

    public readonly sparklineData: number[];
    public readonly topUsers: IGetUniversalTopUserConverted[];

    constructor(data: {
        categories: string[];
        sparklineData: number[];
        topUsers: IGetUniversalTopUser[];
    }) {
        this.categories = data.categories;
        this.sparklineData = data.sparklineData;
        this.topUsers = data.topUsers.map((item) => ({
            color: colorFromUuid(item.uuid),
            username: item.username,
            total: Number(item.total),
        }));
    }
}
