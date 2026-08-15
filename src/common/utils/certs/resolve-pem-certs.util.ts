import { readFileSync } from 'node:fs';

export interface IResolvedPemCert {
    cert: string[];
    key: string[];
    name: string;
}

export function readPemLines(filePath: string): string[] {
    return readFileSync(filePath, 'utf-8')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .filter((line) => line);
}

export function resolvePemCerts(certs: unknown): IResolvedPemCert[] {
    if (!Array.isArray(certs)) {
        return [];
    }

    const rawCerts = certs as {
        cert: string | string[];
        key: string | string[];
        name: string;
    }[];

    const resolvedCerts: IResolvedPemCert[] = [];

    for (const cert of rawCerts) {
        try {
            if (Array.isArray(cert.cert) || Array.isArray(cert.key)) {
                continue;
            }

            resolvedCerts.push({
                cert: readPemLines(cert.cert),
                key: readPemLines(cert.key),
                name: cert.name,
            });
        } catch {
            // silence
        }
    }

    return resolvedCerts;
}
