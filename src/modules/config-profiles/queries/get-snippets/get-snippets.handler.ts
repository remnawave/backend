import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { SnippetsRepository } from '@modules/config-profiles/repositories/snippets.repository';
import { SnippetEntity } from '@modules/config-profiles/entities';

import { GetSnippetsQuery } from './get-snippets.query';

@QueryHandler(GetSnippetsQuery)
export class GetSnippetsHandler implements IQueryHandler<
    GetSnippetsQuery,
    TResult<SnippetEntity[]>
> {
    private readonly logger = new Logger(GetSnippetsHandler.name);
    constructor(private readonly snippetsRepository: SnippetsRepository) {}

    async execute(): Promise<TResult<SnippetEntity[]>> {
        try {
            const result = await this.snippetsRepository.getAllSnippets();

            return {
                isOk: true,
                response: result,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_SNIPPETS_ERROR,
            };
        }
    }
}
