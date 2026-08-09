import {
    TAcmeCertificateSource,
    TAcmeCertificateStatus,
    TAcmeChallengeType,
    TAcmeKeyType,
} from '@libs/contracts/constants';

import { AcmeCertificateEntity } from '../entities';

/**
 * A certificate as seen from outside. The certificate chain is public, but it is
 * not returned either: nothing in the UI needs the PEM, and the private key must
 * never leave the panel at all.
 */
export class AcmeCertificateResponseModel {
    public uuid: string;
    public name: string;
    public domains: string[];

    public source: TAcmeCertificateSource;

    public challengeType: TAcmeChallengeType;
    public keyType: TAcmeKeyType;
    public renewBeforeDays: number;
    public isEnabled: boolean;

    public directoryUrl: null | string;
    public email: null | string;
    public eabKid: null | string;

    public status: TAcmeCertificateStatus;
    public lastError: null | string;
    public issuedAt: Date | null;
    public expiresAt: Date | null;
    public fingerprint: null | string;
    public failCount: number;
    public nextRetryAt: Date | null;

    public credentialUuid: null | string;
    public credentialName: null | string;

    public nodes: { inboundTags: string[]; nodeName: null | string; nodeUuid: string }[];

    public createdAt: Date;
    public updatedAt: Date;

    constructor(entity: AcmeCertificateEntity) {
        this.uuid = entity.uuid;
        this.name = entity.name;
        this.domains = entity.domains;

        this.source = entity.source;

        this.challengeType = entity.challengeType;
        this.keyType = entity.keyType;
        this.renewBeforeDays = entity.renewBeforeDays;
        this.isEnabled = entity.isEnabled;

        this.directoryUrl = entity.directoryUrl;
        this.email = entity.email;
        this.eabKid = entity.eabKid;

        this.status = entity.status;
        this.lastError = entity.lastError;
        this.issuedAt = entity.issuedAt;
        this.expiresAt = entity.expiresAt;
        this.fingerprint = entity.fingerprint;
        this.failCount = entity.failCount;
        this.nextRetryAt = entity.nextRetryAt;

        this.credentialUuid = entity.credentialUuid;
        this.credentialName = entity.credentialName;

        this.nodes = entity.nodes.map((binding) => ({
            nodeUuid: binding.nodeUuid,
            nodeName: binding.nodeName,
            inboundTags: binding.inboundTags,
        }));

        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }
}

export class GetAcmeCertificatesResponseModel {
    public total: number;
    public certificates: AcmeCertificateResponseModel[];

    constructor(certificates: AcmeCertificateResponseModel[]) {
        this.certificates = certificates;
        this.total = certificates.length;
    }
}
