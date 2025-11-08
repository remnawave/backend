import { Prisma } from '@prisma/client';

import { SnippetEntity } from '../entities';

export class BaseSnippetResponseModel {
    public readonly name: string;
    public readonly snippet: Prisma.JsonArray;
    public readonly createdAt: Date;

    constructor(entity: SnippetEntity) {
        this.name = entity.name;
        this.snippet = entity.snippet;
    }
}
