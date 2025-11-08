import { ConfigProfileSnippets, Prisma } from '@prisma/client';

export class SnippetEntity implements ConfigProfileSnippets {
    public name: string;
    public snippet: Prisma.JsonArray;
    public createdAt: Date;

    constructor(snippet: Partial<ConfigProfileSnippets>) {
        Object.assign(this, snippet);
        return this;
    }
}
