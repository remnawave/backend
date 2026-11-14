const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/;

/**
 * Xray accepts a comma-separated list of hex SHA-256 values (colons allowed),
 * while Clash-like clients accept a single one. Returns the first valid pin, normalized.
 */
export function getPinnedCertSha256(
    pinnedPeerCertSha256: string | null | undefined,
): string | null {
    if (!pinnedPeerCertSha256) {
        return null;
    }

    for (const value of pinnedPeerCertSha256.split(',')) {
        const pin = value.trim().replaceAll(':', '').toLowerCase();

        if (SHA256_HEX_REGEX.test(pin)) {
            return pin;
        }
    }

    return null;
}

export function getFirstVerifyPeerCertName(
    verifyPeerCertByName: string | null | undefined,
): string | null {
    if (!verifyPeerCertByName) {
        return null;
    }

    const name = verifyPeerCertByName
        .split(',')
        .map((value) => value.trim())
        .find(Boolean);

    return name ?? null;
}
