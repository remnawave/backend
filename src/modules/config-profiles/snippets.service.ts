import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Injectable, Logger } from '@nestjs/common';

import { ICommandResponse } from '@common/types/command-response.type';
import { ERRORS } from '@libs/contracts/constants/errors';

import { SnippetsRepository } from './repositories/snippets.repository';
import { GetSnippetsResponseModel } from './models';
import { SnippetEntity } from './entities';

@Injectable()
export class SnippetsService {
    private readonly logger = new Logger(SnippetsService.name);

    constructor(private readonly snippetsRepository: SnippetsRepository) {}

    public async getSnippets(): Promise<ICommandResponse<GetSnippetsResponseModel>> {
        try {
            const snippets = await this.snippetsRepository.getAllSnippets();

            return {
                isOk: true,
                response: new GetSnippetsResponseModel(snippets, snippets.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_SNIPPETS_ERROR,
            };
        }
    }

    public async deleteSnippetByName(
        name: string,
    ): Promise<ICommandResponse<GetSnippetsResponseModel>> {
        try {
            const snippet = await this.snippetsRepository.findByName(name);

            if (!snippet) {
                return {
                    isOk: false,
                    ...ERRORS.SNIPPET_NOT_FOUND,
                };
            }

            await this.snippetsRepository.deleteByName(name);

            return await this.getSnippets();
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_SNIPPET_BY_NAME_ERROR,
            };
        }
    }

    public async createSnippet(
        name: string,
        snippet: object,
    ): Promise<ICommandResponse<GetSnippetsResponseModel>> {
        try {
            if (!Array.isArray(snippet) || snippet.length === 0) {
                return { isOk: false, ...ERRORS.SNIPPET_CANNOT_BE_EMPTY };
            }

            if (snippet.some((item) => Object.keys(item).length === 0)) {
                return { isOk: false, ...ERRORS.SNIPPET_CANNOT_CONTAIN_EMPTY_OBJECTS };
            }

            const snippetEntity = new SnippetEntity({
                name,
                snippet,
            });

            await this.snippetsRepository.create(snippetEntity);

            return await this.getSnippets();
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'ConfigProfileSnippets' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.SNIPPET_NAME_ALREADY_EXISTS };
                }
            }
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_CONFIG_PROFILE_ERROR,
            };
        }
    }

    public async updateSnippet(
        name: string,
        snippet: object,
    ): Promise<ICommandResponse<GetSnippetsResponseModel>> {
        try {
            if (!Array.isArray(snippet) || snippet.length === 0) {
                return { isOk: false, ...ERRORS.SNIPPET_CANNOT_BE_EMPTY };
            }

            if (snippet.some((item) => Object.keys(item).length === 0)) {
                return { isOk: false, ...ERRORS.SNIPPET_CANNOT_CONTAIN_EMPTY_OBJECTS };
            }

            const existingSnippet = await this.snippetsRepository.findByName(name);

            if (!existingSnippet) {
                return {
                    isOk: false,
                    ...ERRORS.SNIPPET_NOT_FOUND,
                };
            }

            const snippetEntity = new SnippetEntity({
                name,
                snippet,
            });

            await this.snippetsRepository.update(snippetEntity);

            return await this.getSnippets();
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                error.meta?.modelName === 'ConfigProfileSnippets' &&
                Array.isArray(error.meta.target)
            ) {
                const fields = error.meta.target as string[];
                if (fields.includes('name')) {
                    return { isOk: false, ...ERRORS.SNIPPET_NAME_ALREADY_EXISTS };
                }
            }

            return {
                isOk: false,
                ...ERRORS.UPDATE_SNIPPET_ERROR,
            };
        }
    }
}
