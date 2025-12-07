import { createHash } from 'node:crypto';

export function md5(data: string): string {
    return createHash('md5').update(data).digest('hex');
}
