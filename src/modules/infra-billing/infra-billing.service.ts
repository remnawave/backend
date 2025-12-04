import { Injectable, Logger } from '@nestjs/common';

import { TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import {
    CreateInfraBillingHistoryRecordRequestDto,
    CreateInfraBillingNodeRequestDto,
    CreateInfraProviderRequestDto,
    GetInfraBillingHistoryRecordsRequestDto,
    UpdateInfraBillingNodeRequestDto,
    UpdateInfraProviderRequestDto,
} from './dtos';
import {
    DeleteByUuidResponseModel,
    GetBillingNodesResponseModel,
    GetInfraBillingHistoryRecordsResponseModel,
    GetInfraProvidersResponseModel,
} from './models';
import {
    InfraBillingHistoryRepository,
    InfraBillingNodeRepository,
    InfraProviderRepository,
} from './repositories';
import { GetInfraProviderByUuidResponseModel } from './models/get-infra-provider-by-uuid.response.model';
import { InfraBillingHistoryEntity, InfraBillingNodeEntity, InfraProviderEntity } from './entities';

@Injectable()
export class InfraBillingService {
    private readonly logger = new Logger(InfraBillingService.name);

    constructor(
        private readonly infraBillingHistoryRepository: InfraBillingHistoryRepository,
        private readonly infraBillingNodeRepository: InfraBillingNodeRepository,
        private readonly infraProviderRepository: InfraProviderRepository,
    ) {}

    public async getInfraProviders(): Promise<TResult<GetInfraProvidersResponseModel>> {
        try {
            const providers = await this.infraProviderRepository.getFullInfraProviders();

            return {
                isOk: true,
                response: new GetInfraProvidersResponseModel(providers, providers.length),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_INFRA_PROVIDERS_ERROR,
            };
        }
    }

    public async getInfraProviderByUuid(
        uuid: string,
    ): Promise<TResult<GetInfraProviderByUuidResponseModel>> {
        try {
            const provider = await this.infraProviderRepository.getFullInfraProvidersByUuid(uuid);

            if (!provider) {
                return {
                    isOk: false,
                    ...ERRORS.INFRA_PROVIDER_NOT_FOUND,
                };
            }

            return {
                isOk: true,
                response: new GetInfraProviderByUuidResponseModel(provider),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_INFRA_PROVIDER_BY_UUID_ERROR,
            };
        }
    }

    public async deleteInfraProviderByUuid(
        uuid: string,
    ): Promise<TResult<DeleteByUuidResponseModel>> {
        try {
            await this.infraProviderRepository.deleteByUUID(uuid);

            return {
                isOk: true,
                response: new DeleteByUuidResponseModel(true),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_INFRA_PROVIDER_BY_UUID_ERROR,
            };
        }
    }

    public async createInfraProvider(
        dto: CreateInfraProviderRequestDto,
    ): Promise<TResult<GetInfraProviderByUuidResponseModel>> {
        try {
            const provider = await this.infraProviderRepository.create(
                new InfraProviderEntity(dto),
            );

            return await this.getInfraProviderByUuid(provider.uuid);
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_INFRA_PROVIDER_ERROR,
            };
        }
    }

    public async updateInfraProvider(
        dto: UpdateInfraProviderRequestDto,
    ): Promise<TResult<GetInfraProviderByUuidResponseModel>> {
        try {
            const provider = await this.infraProviderRepository.update(
                new InfraProviderEntity(dto),
            );

            return await this.getInfraProviderByUuid(provider.uuid);
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_INFRA_PROVIDER_ERROR,
            };
        }
    }

    public async getInfraBillingHistoryRecords(
        dto: GetInfraBillingHistoryRecordsRequestDto,
    ): Promise<TResult<GetInfraBillingHistoryRecordsResponseModel>> {
        try {
            const records = await this.infraBillingHistoryRepository.getInfraBillingHistoryRecords(
                dto.start,
                dto.size,
            );

            const count =
                await this.infraBillingHistoryRepository.getInfraBillingHistoryRecordsCount();

            return {
                isOk: true,
                response: new GetInfraBillingHistoryRecordsResponseModel(records, count),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_INFRA_BILLING_HISTORY_RECORDS_ERROR,
            };
        }
    }

    public async createInfraBillingHistoryRecord(
        dto: CreateInfraBillingHistoryRecordRequestDto,
    ): Promise<TResult<GetInfraBillingHistoryRecordsResponseModel>> {
        try {
            await this.infraBillingHistoryRepository.create(new InfraBillingHistoryEntity(dto));

            return await this.getInfraBillingHistoryRecords({
                start: 0,
                size: 50,
            });
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_INFRA_BILLING_HISTORY_RECORD_ERROR,
            };
        }
    }

    public async deleteInfraBillingHistoryRecordByUuid(
        uuid: string,
    ): Promise<TResult<GetInfraBillingHistoryRecordsResponseModel>> {
        try {
            await this.infraBillingHistoryRepository.deleteByUUID(uuid);

            return await this.getInfraBillingHistoryRecords({
                start: 0,
                size: 50,
            });
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_INFRA_BILLING_HISTORY_RECORD_BY_UUID_ERROR,
            };
        }
    }

    public async getBillingNodes(): Promise<TResult<GetBillingNodesResponseModel>> {
        try {
            const nodes = await this.infraBillingNodeRepository.getBillingNodes();

            const availableNodes = await this.infraBillingNodeRepository.getAvailableBillingNodes();

            const summary = await this.infraBillingNodeRepository.getInfraSummary();

            return {
                isOk: true,
                response: new GetBillingNodesResponseModel(
                    nodes,
                    availableNodes,
                    nodes.length,
                    availableNodes.length,
                    summary,
                ),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_BILLING_NODES_ERROR,
            };
        }
    }

    public async updateInfraBillingNode(
        dto: UpdateInfraBillingNodeRequestDto,
    ): Promise<TResult<GetBillingNodesResponseModel>> {
        try {
            await this.infraBillingNodeRepository.updateManyBillingAt({
                uuids: dto.uuids,
                nextBillingAt: dto.nextBillingAt,
            });

            return await this.getBillingNodes();
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.UPDATE_INFRA_BILLING_NODE_ERROR,
            };
        }
    }

    public async createInfraBillingNode(
        dto: CreateInfraBillingNodeRequestDto,
    ): Promise<TResult<GetBillingNodesResponseModel>> {
        try {
            await this.infraBillingNodeRepository.create(new InfraBillingNodeEntity(dto));

            return await this.getBillingNodes();
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_INFRA_BILLING_NODE_ERROR,
            };
        }
    }

    public async deleteInfraBillingNodeByUuid(
        uuid: string,
    ): Promise<TResult<GetBillingNodesResponseModel>> {
        try {
            await this.infraBillingNodeRepository.deleteByUUID(uuid);

            return await this.getBillingNodes();
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_INFRA_BILLING_NODE_BY_UUID_ERROR,
            };
        }
    }
}
