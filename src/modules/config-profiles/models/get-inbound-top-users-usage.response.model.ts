import { colorFromId } from '@kastov/uuid-color';

import {
    IGetUniversalTopUser,
    IGetUniversalTopUserConverted,
} from '@modules/nodes-user-usage-history/interfaces';

export class GetInboundTopUsersUsageResponseModel {
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
            color: colorFromId(item.userId),
            userId: Number(item.userId),
            username: item.username,
            total: Number(item.total),
        }));
    }
}
