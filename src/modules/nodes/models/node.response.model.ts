import { fromNanoToNumber } from '@common/utils/nano';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';
import { InfraProviderEntity } from '@modules/infra-billing/entities';

import { INodeHotCache, INodeSystem, INodeVersions } from '../interfaces';
import { NodesEntity } from '../entities';

export class NodeResponseModel {
    public uuid: string;
    public name: string;
    public address: string;
    public port: null | number;
    public isConnected: boolean;
    public isConnecting: boolean;
    public isDisabled: boolean;
    public lastStatusChange: Date | null;
    public lastStatusMessage: null | string;
    public trafficResetDay: null | number;
    public consumptionMultiplier: number;
    public isTrafficTrackingActive: boolean;
    public trafficLimitBytes: null | number;
    public trafficUsedBytes: null | number;
    public notifyPercent: null | number;

    public viewPosition: number;
    public countryCode: string;
    public tags: string[];
    public createdAt: Date;
    public updatedAt: Date;

    public configProfile: {
        activeConfigProfileUuid: string | null;
        activeInbounds: ConfigProfileInboundEntity[];
    };
    public providerUuid: string | null;
    public provider: InfraProviderEntity | null;
    public activePluginUuid: string | null;

    public xrayUptime: number;
    public usersOnline: number;
    public system: INodeSystem | null;
    public versions: INodeVersions | null;

    constructor(data: NodesEntity, hotCache: INodeHotCache) {
        this.uuid = data.uuid;
        this.name = data.name;
        this.address = data.address;
        this.port = data.port;
        this.isConnected = data.isConnected;
        this.isConnecting = data.isConnecting;
        this.isDisabled = data.isDisabled;
        this.lastStatusChange = data.lastStatusChange;
        this.lastStatusMessage = data.lastStatusMessage;
        this.isTrafficTrackingActive = data.isTrafficTrackingActive;
        this.trafficResetDay = data.trafficResetDay;
        this.trafficLimitBytes = Number(data.trafficLimitBytes);
        this.trafficUsedBytes = Number(data.trafficUsedBytes);
        this.notifyPercent = data.notifyPercent;

        this.consumptionMultiplier = fromNanoToNumber(data.consumptionMultiplier);

        this.tags = data.tags;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.viewPosition = data.viewPosition;
        this.countryCode = data.countryCode;

        this.configProfile = {
            activeConfigProfileUuid: data.activeConfigProfileUuid,
            activeInbounds: data.activeInbounds,
        };

        this.providerUuid = data.providerUuid;
        this.provider = data.provider;
        this.activePluginUuid = data.activePluginUuid;

        this.system = hotCache.system;
        this.usersOnline = hotCache.onlineUsers;
        this.versions = hotCache.versions;
        this.xrayUptime = hotCache.xrayUptime;
    }
}
