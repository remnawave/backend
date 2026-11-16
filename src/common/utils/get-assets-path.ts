import path from 'node:path';

import { isDevelopment } from './startup-app';

export function getAssetsPath(): string {
    return process.env.REMNAWAVE_ASSETS_PATH ?? (isDevelopment() ? path.resolve(process.cwd(), 'frontend') : '/opt/app/frontend');
}
