import { Prisma } from '@generated/prisma/client';

import { SnippetEntity } from '../entities';

export class BaseSnippetResponseModel {
    public readonly name: string;
    public readonly snippet: Prisma.InputJsonArray;
    public readonly createdAt: Date;

    constructor(entity: SnippetEntity) {
        this.name = entity.name;
        this.snippet = entity.snippet;
    }
}
