import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants';

import { SubscriptionSettingsRepository } from '../../repositories/subscription-settings.repository';
import { SubscriptionSettingsEntity } from '../../entities/subscription-settings.entity';
import { GetSubscriptionSettingsQuery } from './get-subscription-settings.query';

@QueryHandler(GetSubscriptionSettingsQuery)
export class GetSubscriptionSettingsHandler implements IQueryHandler<
    GetSubscriptionSettingsQuery,
    ICommandResponse<SubscriptionSettingsEntity>
> {
    private readonly logger = new Logger(GetSubscriptionSettingsHandler.name);

    constructor(private readonly subscriptionSettingsRepository: SubscriptionSettingsRepository) {}

    async execute(): Promise<ICommandResponse<SubscriptionSettingsEntity>> {
        try {
            const settings = await this.subscriptionSettingsRepository.findFirst();

            if (!settings) {
                return {
                    isOk: false,
                    ...ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: settings,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_SUBSCRIPTION_SETTINGS_ERROR,
            };
        }
    }
}
