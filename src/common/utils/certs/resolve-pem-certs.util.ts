import { readFileSync, realpathSync } from 'node:fs';
import { sep } from 'node:path';

const ALLOWED_PEM_DIR = '/var/lib/remnawave';

export interface IResolvedPemCert {
    cert: string[];
    key: string[];
    name: string;
}

function resolveAllowedPemPath(filePath: string): string {
    const realPath = realpathSync(filePath);
    const allowedDir = realpathSync(ALLOWED_PEM_DIR);

    if (!realPath.startsWith(allowedDir + sep)) {
        throw new Error(`PEM file must be located inside ${ALLOWED_PEM_DIR}`);
    }

    return realPath;
}

export function readPemLines(filePath: string): string[] {
    return readFileSync(resolveAllowedPemPath(filePath), 'utf-8')
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
