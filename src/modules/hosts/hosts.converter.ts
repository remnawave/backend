import { Hosts } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { HostsEntity } from './entities/hosts.entity';

const modelToEntity = (model: Hosts): HostsEntity => {
    return new HostsEntity(model);
};

const entityToModel = (entity: HostsEntity): Hosts => {
    return {
        uuid: entity.uuid,

        viewPosition: entity.viewPosition,
        remark: entity.remark,
        address: entity.address,
        port: entity.port,
        path: entity.path,
        sni: entity.sni,
        host: entity.host,
        alpn: entity.alpn,
        fingerprint: entity.fingerprint,
        securityLayer: entity.securityLayer,
        isDisabled: entity.isDisabled,
        xhttpExtraParams: entity.xhttpExtraParams,
        muxParams: entity.muxParams,
        sockoptParams: entity.sockoptParams,
        finalMask: entity.finalMask,
        serverDescription: entity.serverDescription,
        pinnedPeerCertSha256: entity.pinnedPeerCertSha256,
        verifyPeerCertByName: entity.verifyPeerCertByName,
        shuffleHost: entity.shuffleHost,
        mihomoX25519: entity.mihomoX25519,
        mihomoIpVersion: entity.mihomoIpVersion,
        tags: entity.tags,
        isHidden: entity.isHidden,

        overrideSniFromAddress: entity.overrideSniFromAddress,
        keepSniBlank: entity.keepSniBlank,
        configProfileUuid: entity.configProfileUuid,
        configProfileInboundUuid: entity.configProfileInboundUuid,

        vlessRouteId: entity.vlessRouteId,

        xrayJsonTemplateUuid: entity.xrayJsonTemplateUuid,
        excludeFromSubscriptionTypes: entity.excludeFromSubscriptionTypes,
        mapper: entity.mapper,
    };
};

@Injectable()
export class HostsConverter extends UniversalConverter<HostsEntity, Hosts> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
