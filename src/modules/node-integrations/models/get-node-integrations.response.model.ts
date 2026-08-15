import { NodeIntegrationEntity } from '../entities';
import { BaseNodeIntegrationResponseModel } from './base-node-integration.response.model';

export class GetNodeIntegrationsResponseModel {
    public readonly total: number;
    public readonly nodeIntegrations: BaseNodeIntegrationResponseModel[];

    constructor(entities: NodeIntegrationEntity[], total: number) {
        this.total = total;
        this.nodeIntegrations = entities.map(
            (integration) => new BaseNodeIntegrationResponseModel(integration),
        );
    }
}
