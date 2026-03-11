import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { RemnawaveSettingsRepository } from '@modules/remnawave-settings/repositories/remnawave-settings.repository';

import { GetInitDateQuery } from './get-init-date.query';

@QueryHandler(GetInitDateQuery)
export class GetInitDateHandler implements IQueryHandler<GetInitDateQuery, Date> {
    private readonly logger = new Logger(GetInitDateHandler.name);
    constructor(private readonly remnawaveSettingsRepository: RemnawaveSettingsRepository) {}

    async execute(): Promise<Date> {
        try {
            const initDate = await this.remnawaveSettingsRepository.getInitDate();

            return initDate;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
