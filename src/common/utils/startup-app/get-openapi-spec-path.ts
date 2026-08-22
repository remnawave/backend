import path from 'node:path';

export function getOpenApiSpecPath(): string {
    return path.resolve(process.cwd(), 'openapi.json');
}
