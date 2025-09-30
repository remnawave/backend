import { Injectable, Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { GetSubscriptionRequestHistoryCommand } from '@libs/contracts/commands';
import { ERRORS } from '@libs/contracts/constants';

import { UserSubscriptionRequestHistoryRepository } from './repositories/user-subscription-request-history.repository';
import { GetSubscriptionRequestHistoryStatsResponseModel } from './models';
import { UserSubscriptionRequestHistoryEntity } from './entities';

@Injectable()
export class UserSubscriptionRequestHistoryService {
    private readonly logger = new Logger(UserSubscriptionRequestHistoryService.name);
    constructor(
        private readonly userSubscriptionRequestHistoryRepository: UserSubscriptionRequestHistoryRepository,
    ) {}

    public async getSubscriptionRequestHistory(
        dto: GetSubscriptionRequestHistoryCommand.RequestQuery,
    ): Promise<
        ICommandResponse<{
            total: number;
            records: UserSubscriptionRequestHistoryEntity[];
        }>
    > {
        try {
            const [records, total] =
                await this.userSubscriptionRequestHistoryRepository.getAllSubscriptionRequestHistory(
                    dto,
                );

            return {
                isOk: true,
                response: {
                    records,
                    total,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR,
            };
        }
    }

    public async getSubscriptionRequestHistoryStats(): Promise<
        ICommandResponse<GetSubscriptionRequestHistoryStatsResponseModel>
    > {
        try {
            const stats =
                await this.userSubscriptionRequestHistoryRepository.getSubscriptionRequestHistoryStats();

            const hourlyRequestStats =
                await this.userSubscriptionRequestHistoryRepository.getHourlyRequestStats();

            return {
                isOk: true,
                response: new GetSubscriptionRequestHistoryStatsResponseModel({
                    byParsedApp: stats.byParsedApp,
                    hourlyRequestStats: hourlyRequestStats,
                }),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_USER_SUBSCRIPTION_REQUEST_HISTORY_STATS_ERROR,
            };
        }
    }
}
