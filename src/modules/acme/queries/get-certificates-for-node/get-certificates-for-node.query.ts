/**
 * Certificate material for one node, ready to be injected into the config it is
 * about to receive.
 */
export interface INodeCertificate {
    /** PEM chain split into lines, the shape Xray expects inline. */
    certificate: string[];
    /** Subject common name, when the certificate has one at all. */
    commonName: null | string;
    /**
     * Every name the certificate covers. Together with the common name this is
     * how an entry already on the inbound is recognized as the same certificate:
     * SAN-only certificates have no common name to match on.
     */
    domains: string[];
    fingerprint: string;
    /** Empty means every TLS inbound of the node. */
    inboundTags: string[];
    key: string[];
}

export class GetCertificatesForNodeQuery {
    constructor(public readonly nodeUuid: string) {}
}
