import {
    TAlpnValues,
    TMihomoIpVersion,
    TSecurityLayers,
    TSubscriptionTemplateType,
} from '@libs/contracts/constants';
import { THostMapper } from '@libs/contracts/models';

import { HostsEntity } from '../entities/hosts.entity';

export class HostResponseModel {
    public uuid: string;

    public viewPosition: number;
    public remark: string;
    public address: string;
    public port: number;
    public path: null | string;
    public sni: null | string;
    public host: null | string;
    public alpn: null | TAlpnValues;
    public fingerprint: null | string;
    public isDisabled: boolean;
    public securityLayer: TSecurityLayers;
    public xhttpExtraParams: null | object;
    public muxParams: null | object;
    public sockoptParams: null | object;
    public finalMask: null | object;
    public serverDescription: null | string;
    public pinnedPeerCertSha256: string | null;
    public verifyPeerCertByName: string | null;

    public shuffleHost: boolean;
    public mihomoX25519: boolean;
    public mihomoIpVersion: TMihomoIpVersion | null;
    public tags: string[];
    public isHidden: boolean;

    public overrideSniFromAddress: boolean;
    public keepSniBlank: boolean;
    public vlessRouteId: number | null;

    public inbound: {
        configProfileUuid: string | null;
        configProfileInboundUuid: string | null;
    };

    public nodes: string[];

    public xrayJsonTemplateUuid: string | null;

    public excludedInternalSquads: string[];
    public excludeFromSubscriptionTypes: TSubscriptionTemplateType[];
    public mapper: THostMapper;

    constructor(data: HostsEntity) {
        this.uuid = data.uuid;

        this.viewPosition = data.viewPosition;
        this.remark = data.remark;
        this.address = data.address;
        this.port = data.port;
        this.path = data.path;
        this.sni = data.sni;
        this.host = data.host;
        this.alpn = data.alpn as TAlpnValues | null;
        this.fingerprint = data.fingerprint;

        this.isDisabled = data.isDisabled;
        this.securityLayer = data.securityLayer;
        this.xhttpExtraParams = data.xhttpExtraParams;
        this.muxParams = data.muxParams;
        this.sockoptParams = data.sockoptParams;
        this.finalMask = data.finalMask;
        this.serverDescription = data.serverDescription;
        this.pinnedPeerCertSha256 = data.pinnedPeerCertSha256;
        this.verifyPeerCertByName = data.verifyPeerCertByName;
        this.shuffleHost = data.shuffleHost;
        this.mihomoX25519 = data.mihomoX25519;
        this.mihomoIpVersion = data.mihomoIpVersion;

        this.tags = data.tags;
        this.isHidden = data.isHidden;

        this.overrideSniFromAddress = data.overrideSniFromAddress;
        this.keepSniBlank = data.keepSniBlank;
        this.vlessRouteId = data.vlessRouteId;
        this.inbound = {
            configProfileUuid: data.configProfileUuid,
            configProfileInboundUuid: data.configProfileInboundUuid,
        };

        this.nodes = data.nodes.map((node) => node.nodeUuid);
        this.excludedInternalSquads = data.excludedInternalSquads.map(
            (exclusion) => exclusion.squadUuid,
        );

        this.xrayJsonTemplateUuid = data.xrayJsonTemplateUuid;
        this.excludeFromSubscriptionTypes = data.excludeFromSubscriptionTypes;
        this.mapper = data.mapper;
    }
}
