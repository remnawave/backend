import type { ConfigProfileSnippetsModel as ConfigProfileSnippets } from '@generated/prisma/models';

import { Prisma } from '@generated/prisma/client';

export class SnippetEntity implements ConfigProfileSnippets {
    public name: string;
    public snippet: Prisma.JsonArray;
    public createdAt: Date;

    constructor(snippet: Partial<ConfigProfileSnippets>) {
        Object.assign(this, snippet);
        return this;
    }
}
