import { ConfigProfileSnippets } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { SnippetEntity } from '../entities/snippet.entity';

const modelToEntity = (model: ConfigProfileSnippets): SnippetEntity => {
    return new SnippetEntity(model);
};

const entityToModel = (entity: SnippetEntity): ConfigProfileSnippets => {
    return {
        name: entity.name,
        snippet: entity.snippet,
        createdAt: entity.createdAt,
    };
};

@Injectable()
export class SnippetsConverter extends UniversalConverter<SnippetEntity, ConfigProfileSnippets> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
