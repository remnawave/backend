/**
 * What is stored, encrypted, in acme_credentials.payload_encrypted: the
 * provider fields from ACME_PROVIDER_REGISTRY, secret and plain alike, as one
 * flat map. MANUAL stores nothing.
 */
export type TAcmeCredentialPayload = Record<string, string>;
