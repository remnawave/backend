import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { Injectable, Logger } from '@nestjs/common';

import { XRayConfig } from '@common/helpers/xray-config';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants/errors';

import { NodesQueuesService } from '@queue/_nodes';

import { ConfigProfileRepository } from './repositories/config-profile.repository';
import { SnippetsRepository } from './repositories/snippets.repository';
import { GetSnippetsResponseModel } from './models';
import { SnippetEntity } from './entities';

@Injectable()
export class SnippetsService {
    private readonly logger = new Logger(SnippetsService.name);

    constructor(
        private readonly snippetsRepository: SnippetsRepository,
        private readonly configProfileRepository: ConfigProfileRepository,
        private readonly nodesQueuesService: NodesQueuesService,
    ) {}

    private async restartNodesUsingSnippet(name: string, emitter: string): Promise<void> {
        try {
            const configProfiles = await this.configProfileRepository.getAllConfigProfiles();

            for (const configProfile of configProfiles) {
                let referencedSnippets: Set<string>;

                try {
                    referencedSnippets = new XRayConfig(
                        configProfile.config as object,
                    ).getReferencedSnippetNames();
                } catch (error) {
                    this.logger.error(
                        `Failed to parse config of profile ${configProfile.uuid} while resolving snippet usage: ${error}`,
                    );
                    continue;
                }

                if (!referencedSnippets.has(name)) {
                    continue;
                }

                await this.nodesQueuesService.startAllNodesByProfile({
                    profileUuid: configProfile.uuid,
                    emitter,
                });
            }
        } catch (error) {
            // The snippet mutation itself already succeeded, so a failure to
            // enqueue node restarts must not fail the request.
            this.logger.error(`Failed to restart nodes after snippet "${name}" change: ${error}`);
        }
    }

    public async getSnippets(): Promise<TResult<GetSnippetsResponseModel>> {
        try {
            const snippets = await this.snippetsRepository.getAllSnippets();

            return ok(new GetSnippetsResponseModel(snippets, snippets.length));
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_SNIPPETS_ERROR);
        }
    }

    public async deleteSnippetByName(name: string): Promise<TResult<GetSnippetsResponseModel>> {
        try {
            const snippet = await this.snippetsRepository.findByName(name);

            if (!snippet) {
                return fail(ERRORS.SNIPPET_NOT_FOUND);
            }

            await this.snippetsRepository.deleteByName(name);

            await this.restartNodesUsingSnippet(name, 'deleteSnippetByName');

            return await this.getSnippets();
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_SNIPPET_BY_NAME_ERROR);
        }
    }

    public async createSnippet(
        name: string,
        snippet: object,
    ): Promise<TResult<GetSnippetsResponseModel>> {
        try {
            if (!Array.isArray(snippet) || snippet.length === 0) {
                return fail(ERRORS.SNIPPET_CANNOT_BE_EMPTY);
            }

            if (snippet.some((item) => Object.keys(item).length === 0)) {
                return fail(ERRORS.SNIPPET_CANNOT_CONTAIN_EMPTY_OBJECTS);
            }

            const snippetEntity = new SnippetEntity({
                name,
                snippet,
            });

            await this.snippetsRepository.create(snippetEntity);

            await this.restartNodesUsingSnippet(name, 'createSnippet');

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
                    return fail(ERRORS.SNIPPET_NAME_ALREADY_EXISTS);
                }
            }
            this.logger.error(error);
            return fail(ERRORS.CREATE_CONFIG_PROFILE_ERROR);
        }
    }

    public async updateSnippet(
        name: string,
        snippet: object,
    ): Promise<TResult<GetSnippetsResponseModel>> {
        try {
            if (!Array.isArray(snippet) || snippet.length === 0) {
                return fail(ERRORS.SNIPPET_CANNOT_BE_EMPTY);
            }

            if (snippet.some((item) => Object.keys(item).length === 0)) {
                return fail(ERRORS.SNIPPET_CANNOT_CONTAIN_EMPTY_OBJECTS);
            }

            const existingSnippet = await this.snippetsRepository.findByName(name);

            if (!existingSnippet) {
                return fail(ERRORS.SNIPPET_NOT_FOUND);
            }

            const snippetEntity = new SnippetEntity({
                name,
                snippet,
            });

            await this.snippetsRepository.update(snippetEntity);

            await this.restartNodesUsingSnippet(name, 'updateSnippet');

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
                    return fail(ERRORS.SNIPPET_NAME_ALREADY_EXISTS);
                }
            }

            return fail(ERRORS.UPDATE_SNIPPET_ERROR);
        }
    }
}
