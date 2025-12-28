import { readPackageJSON } from 'pkg-types';
import fs from 'node:fs';

import { DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

import { CONTROLLERS_INFO } from '@libs/contracts/api/controllers-info';

import {
    RemnawaveWebhookCrmEventsDto,
    RemnawaveWebhookErrorsEventsDto,
    RemnawaveWebhookNodeEventsDto,
    RemnawaveWebhookServiceEventsDto,
    RemnawaveWebhookUserEventsDto,
    RemnawaveWebhookUserHwidDevicesEventsDto,
} from './extra-models';

const description = `
Remnawave is a powerful proxy managment tool, built on top of Xray-core, with a focus on simplicity and ease of use.

## Resources
* https://t.me/remnawave
* https://github.com/remnawave
* https://docs.rw
`;

export async function ghActionsDocs(app: INestApplication<unknown>) {
    const pkg = await readPackageJSON();

    const configSwagger = new DocumentBuilder()
        .setTitle(`Remnawave API v${pkg.version}`)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'JWT obtained login.',
            },
            'Authorization',
        )
        .addBasicAuth(
            {
                type: 'http',
                scheme: 'basic',
                name: 'Prometheus',
                description: 'Prometheus Basic Auth',
            },
            'Prometheus',
        )
        .setDescription(description)
        .setVersion(pkg.version!)
        .setLicense('AGPL-3.0', 'https://github.com/remnawave/panel?tab=AGPL-3.0-1-ov-file');

    Object.values(CONTROLLERS_INFO).reduce((builder, { tag, description }) => {
        return builder.addTag(tag, description);
    }, configSwagger);

    const builtConfigSwagger = configSwagger.build();

    const documentFactory = () =>
        SwaggerModule.createDocument(app, builtConfigSwagger, {
            extraModels: [
                RemnawaveWebhookUserEventsDto,
                RemnawaveWebhookUserHwidDevicesEventsDto,
                RemnawaveWebhookNodeEventsDto,
                RemnawaveWebhookServiceEventsDto,
                RemnawaveWebhookErrorsEventsDto,
                RemnawaveWebhookCrmEventsDto,
            ],
        });

    const document = documentFactory();

    fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
}
