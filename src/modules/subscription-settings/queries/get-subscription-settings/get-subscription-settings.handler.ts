import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { SubscriptionSettingsRepository } from '../../repositories/subscription-settings.repository';
import { SubscriptionSettingsEntity } from '../../entities/subscription-settings.entity';
import { GetSubscriptionSettingsQuery } from './get-subscription-settings.query';

@QueryHandler(GetSubscriptionSettingsQuery)
export class GetSubscriptionSettingsHandler implements IQueryHandler<
    GetSubscriptionSettingsQuery,
    TResult<SubscriptionSettingsEntity>
> {
    private readonly logger = new Logger(GetSubscriptionSettingsHandler.name);

    constructor(private readonly subscriptionSettingsRepository: SubscriptionSettingsRepository) {}

    async execute(): Promise<TResult<SubscriptionSettingsEntity>> {
        try {
            const settings = await this.subscriptionSettingsRepository.findFirst();

            if (!settings) {
                return fail(ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND);
            }

            return ok(settings);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_SUBSCRIPTION_SETTINGS_ERROR);
        }
    }
}
