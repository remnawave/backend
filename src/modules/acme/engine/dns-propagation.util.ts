import { Resolver } from 'node:dns/promises';

/**
 * Public resolvers used to check that a record is visible. Asking the local
 * resolver would be pointless: it may be the provider's own view, or a cache
 * that answers with the record before it exists anywhere else.
 */
const PUBLIC_RESOLVERS = ['1.1.1.1', '8.8.8.8'];

const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_INTERVAL_MS = 5_000;

export interface IWaitForTxtOptions {
    intervalMs?: number;
    timeoutMs?: number;
}

/**
 * Waits until every public resolver returns the expected TXT value.
 *
 * This exists because the CA validates within seconds of being told to, and a
 * provider API returning 200 only means the record was accepted — not that it is
 * being served yet. Skipping the wait turns into random validation failures that
 * look like the solver is broken.
 */
export async function waitForTxtRecord(
    fqdn: string,
    expectedValue: string,
    options: IWaitForTxtOptions = {},
): Promise<boolean> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const results = await Promise.all(
            PUBLIC_RESOLVERS.map((server) => hasTxtValue(server, fqdn, expectedValue)),
        );

        if (results.every(Boolean)) {
            return true;
        }

        await sleep(intervalMs);
    }

    return false;
}

/** One-shot check, used to tell whether a persistent record is already published. */
export async function isTxtValuePublished(fqdn: string, expectedValue: string): Promise<boolean> {
    const results = await Promise.all(
        PUBLIC_RESOLVERS.map((server) => hasTxtValue(server, fqdn, expectedValue)),
    );

    return results.some(Boolean);
}

async function hasTxtValue(server: string, fqdn: string, expectedValue: string): Promise<boolean> {
    const resolver = new Resolver({ timeout: 5_000, tries: 2 });
    resolver.setServers([server]);

    try {
        const records = await resolver.resolveTxt(fqdn);

        // A TXT record arrives as an array of strings that has to be joined back
        // together: long values are split into 255-byte chunks on the wire.
        return records.some((chunks) => chunks.join('') === expectedValue);
    } catch {
        // NXDOMAIN and friends simply mean "not yet".
        return false;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
