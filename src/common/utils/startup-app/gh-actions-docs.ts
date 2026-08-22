import fs from 'node:fs';

import { INestApplication } from '@nestjs/common';

import { createOpenApiDocumentFactory } from './build-openapi-document';
import { getOpenApiSpecPath } from './get-openapi-spec-path';

export async function ghActionsDocs(app: INestApplication<unknown>) {
    const buildDocument = await createOpenApiDocumentFactory(app);
    const specPath = getOpenApiSpecPath();

    fs.writeFileSync(specPath, JSON.stringify(buildDocument(), null, 0));

    return specPath;
}
