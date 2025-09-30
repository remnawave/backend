import { TSecurityLayers } from '@libs/contracts/constants';

import { HostsEntity } from '../entities/hosts.entity';

export class CreateHostResponseModel {
    public uuid: string;

    public viewPosition: number;
    public remark: string;
    public address: string;
    public port: number;
    public path: null | string;
    public sni: null | string;
    public host: null | string;
    public alpn: null | string;
    public fingerprint: null | string;
    public isDisabled: boolean;
    public securityLayer: TSecurityLayers;
    public xHttpExtraParams: null | object;
    public muxParams: null | object;
    public sockoptParams: null | object;

    public serverDescription: null | string;
    public allowInsecure: boolean;

    public shuffleHost: boolean;
    public mihomoX25519: boolean;

    public tag: null | string;
    public isHidden: boolean;

    public overrideSniFromAddress: boolean;
    public vlessRouteId: number | null;

    public inbound: {
        configProfileUuid: string | null;
        configProfileInboundUuid: string | null;
    };

    constructor(data: HostsEntity) {
        this.uuid = data.uuid;

        this.viewPosition = data.viewPosition;
        this.remark = data.remark;
        this.address = data.address;
        this.port = data.port;
        this.path = data.path;
        this.sni = data.sni;
        this.host = data.host;
        this.alpn = data.alpn;
        this.fingerprint = data.fingerprint;

        this.isDisabled = data.isDisabled;
        this.securityLayer = data.securityLayer;
        this.xHttpExtraParams = data.xHttpExtraParams;
        this.muxParams = data.muxParams;
        this.sockoptParams = data.sockoptParams;
        this.serverDescription = data.serverDescription;
        this.allowInsecure = data.allowInsecure;
        this.shuffleHost = data.shuffleHost;
        this.mihomoX25519 = data.mihomoX25519;

        this.tag = data.tag;
        this.isHidden = data.isHidden;

        this.overrideSniFromAddress = data.overrideSniFromAddress;
        this.vlessRouteId = data.vlessRouteId;
        this.inbound = {
            configProfileUuid: data.configProfileUuid,
            configProfileInboundUuid: data.configProfileInboundUuid,
        };
    }
}
