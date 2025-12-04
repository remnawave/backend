import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';

import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { SignApiTokenCommand } from '../auth/commands/sign-api-token/sign-api-token.command';
import { IApiTokenDeleteResponse, ICreateApiTokenRequest } from './interfaces';
import { ApiTokensRepository } from './repositories/api-tokens.repository';
import { FindAllApiTokensResponseModel } from './models/find.model';
import { ApiTokenEntity } from './entities/api-token.entity';

@Injectable()
export class ApiTokensService {
    private readonly logger = new Logger(ApiTokensService.name);
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,

        private readonly apiTokensRepository: ApiTokensRepository,
        private readonly commandBus: CommandBus,
        private readonly configService: ConfigService,
    ) {}

    public async create(body: ICreateApiTokenRequest): Promise<TResult<ApiTokenEntity>> {
        const { tokenName } = body;

        try {
            const uuid = randomUUID();

            const token = await this.signApiToken({
                uuid,
            });

            if (!token.isOk) {
                return fail(ERRORS.CREATE_API_TOKEN_ERROR);
            }

            const apiTokenEntity = new ApiTokenEntity({
                uuid,
                tokenName,
                token: token.response,
            });

            const newApiTokenEntity = await this.apiTokensRepository.create(apiTokenEntity);

            return ok(newApiTokenEntity);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_API_TOKEN_ERROR);
        }
    }

    public async delete(uuid: string): Promise<TResult<IApiTokenDeleteResponse>> {
        try {
            const result = await this.apiTokensRepository.deleteByUUID(uuid);

            await this.cacheManager.del(`api:${uuid}`);

            return ok({ result });
        } catch (error) {
            this.logger.error(JSON.stringify(error));

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return fail(ERRORS.REQUESTED_TOKEN_NOT_FOUND);
                }
            }
            return fail(ERRORS.DELETE_API_TOKEN_ERROR);
        }
    }

    public async findAll(): Promise<TResult<FindAllApiTokensResponseModel>> {
        try {
            const result = await this.apiTokensRepository.findByCriteria({});

            const isDocsEnabled = this.configService.getOrThrow<string>('IS_DOCS_ENABLED');
            const scalarPath = this.configService.get<string>('SCALAR_PATH') ?? null;
            const swaggerPath = this.configService.get<string>('SWAGGER_PATH') ?? null;

            const docs = {
                isDocsEnabled: isDocsEnabled === 'true',
                scalarPath: scalarPath,
                swaggerPath: swaggerPath,
            };

            return ok({
                apiKeys: result.map((item) => item),
                docs,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.FIND_ALL_API_TOKENS_ERROR);
        }
    }
    private async signApiToken(dto: SignApiTokenCommand): Promise<TResult<string>> {
        return this.commandBus.execute<SignApiTokenCommand, TResult<string>>(
            new SignApiTokenCommand(dto.uuid),
        );
    }
}
