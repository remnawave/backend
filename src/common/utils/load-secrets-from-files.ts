import { readFileSync } from 'node:fs';

/**
 * Docker/Podman secrets support.
 *
 * For every known variable `X` the value can be provided in a file by setting `X_FILE`
 * (e.g. `APP_SECRET_FILE=/run/secrets/app_secret`), the same convention the official
 * postgres/mysql images use. Resolved values are written both to the returned config
 * and to `process.env`, so consumers that read `process.env` directly (Prisma) see them too.
 *
 * Secret values are never included in error messages or logs.
 */
export function loadSecretsFromFiles<T extends Record<string, unknown>>(
    config: T,
    keys: readonly string[],
): T {
    const resolvedConfig: Record<string, unknown> = { ...config };

    for (const key of keys) {
        const fileKey = `${key}_FILE`;
        const filePath = nonEmptyString(resolvedConfig[fileKey]);

        if (!filePath) {
            continue;
        }

        if (nonEmptyString(resolvedConfig[key])) {
            throw new Error(
                `❌ ${key} and ${fileKey} are both set. Remove one of them and restart the application.`,
            );
        }

        let value: string;

        try {
            value = readFileSync(filePath, 'utf8');
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code ?? 'unknown error';

            throw new Error(
                `❌ ${fileKey} points to "${filePath}", which can not be read: ${code}`,
            );
        }

        value = value.replace(/(\r?\n)+$/, '');

        if (!value) {
            throw new Error(`❌ ${fileKey} points to "${filePath}", which is empty.`);
        }

        resolvedConfig[key] = value;
        process.env[key] = value;
    }

    return resolvedConfig as T;
}

function nonEmptyString(value: unknown): string | undefined {
    return typeof value === 'string' && value !== '' ? value : undefined;
}
