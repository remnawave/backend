/**
 * What the issuance flow needs from a credential: a way to put a TXT record into
 * DNS and take it away again.
 *
 * The panel never talks to a DNS provider directly unless the operator chose to
 * store a provider token in it; with CUSTOM (broker) credentials the record is
 * published by the proxy, and the panel holds only a scoped client token.
 */
export interface IDnsSolver {
    /**
     * Whether this solver can write to DNS at all. MANUAL cannot: it exists for
     * dns-persist-01, where a single record is published by hand and issuance
     * needs no DNS access afterwards.
     */
    readonly canPublish: boolean;

    /** Publish a DNS-01 challenge record. Must be additive: several TXT values may share a name. */
    present(fqdn: string, value: string): Promise<void>;

    /** Remove a challenge record. Removing what is already gone must not fail. */
    cleanup(fqdn: string, value: string): Promise<void>;

    /** Upsert the persistent authorization record of dns-persist-01. */
    publishPersist(fqdn: string, value: string): Promise<void>;

    /** What this credential is allowed to do; shown by the "test" action. */
    describe(): Promise<IDnsSolverDescription>;
}

export interface IDnsSolverDescription {
    allow: string[];
    isOk: boolean;
    message: string;
    zones: string[];
}
