import { resolvePemCerts } from '@common/utils/certs';

export type TNodeIntegrationsPayload = Record<string, unknown>;

const CERTS_KEY = 'certs';

export function resolveIntegrationConfig(config: unknown): TNodeIntegrationsPayload {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return {};
    }

    const resolved = { ...(config as TNodeIntegrationsPayload) };

    if (CERTS_KEY in resolved) {
        resolved[CERTS_KEY] = resolvePemCerts(resolved[CERTS_KEY]);
    }

    return resolved;
}

export function mergeNodeIntegrations(
    configs: TNodeIntegrationsPayload[],
): TNodeIntegrationsPayload {
    return Object.assign({}, ...configs) as TNodeIntegrationsPayload;
}
