import { AcmeCertificateNodes, AcmeCertificates } from '@prisma/client';

import {
    TAcmeCertificateSource,
    TAcmeCertificateStatus,
    TAcmeChallengeType,
    TAcmeKeyType,
} from '@libs/contracts/constants';

export class AcmeCertificateNodeEntity implements AcmeCertificateNodes {
    public certificateUuid: string;
    public nodeUuid: string;
    public inboundTags: string[];

    /** Filled in when the node was joined; the UI shows names, not uuids. */
    public nodeName: null | string;

    constructor(binding: Partial<AcmeCertificateNodes> & { nodeName?: null | string }) {
        Object.assign(this, binding);

        this.nodeName = binding.nodeName ?? null;

        return this;
    }
}

export class AcmeCertificateEntity implements AcmeCertificates {
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

    public fullchainPem: null | string;
    public keyEncrypted: null | string;

    public credentialUuid: null | string;
    public accountUuid: null | string;

    public createdAt: Date;
    public updatedAt: Date;

    public nodes: AcmeCertificateNodeEntity[];
    public credentialName: null | string;

    constructor(
        certificate: Partial<AcmeCertificates> & {
            credential?: { name: string } | null;
            nodes?: (AcmeCertificateNodes & { node?: { name: string } | null })[];
        },
    ) {
        Object.assign(this, certificate);

        this.nodes = (certificate.nodes ?? []).map(
            (binding) =>
                new AcmeCertificateNodeEntity({
                    ...binding,
                    nodeName: binding.node?.name ?? null,
                }),
        );

        this.credentialName = certificate.credential?.name ?? null;

        return this;
    }
}
