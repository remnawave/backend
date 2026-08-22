import { cleanupOpenApiDoc } from 'nestjs-zod';
import { readPackageJSON } from 'pkg-types';

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, getSchemaPath, OpenAPIObject } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger';

import { CONTROLLERS_INFO } from '@libs/contracts/api';

import {
    RemnawaveWebhookCrmEventsDto,
    RemnawaveWebhookErrorsEventsDto,
    RemnawaveWebhookNodeEventsDto,
    RemnawaveWebhookServiceEventsDto,
    RemnawaveWebhookUserEventsDto,
    RemnawaveWebhookUserHwidDevicesEventsDto,
    RemnawaveWebhookTorrentBlockerEventsDto,
    RemnawaveNotFoundErrorDto,
    RemnawaveBadRequestErrorDto,
    RemnawaveInternalServerErrorDto,
    RemnawaveValidationErrorDto,
    RemnawaveUserUsageStreamMessageDto,
    RemnawaveSubscriptionRequestStreamMessageDto,
    RemnawaveNodeConnectionsStreamMessageDto,
} from './extra-models';

const description = `
Remnawave is a powerful proxy management tool, built on top of Xray-core, with a focus on simplicity and ease of use.

## Resources
* https://t.me/remnawave
* https://github.com/remnawave
* https://docs.rw
`;

export async function createOpenApiDocumentFactory(
    app: INestApplication<unknown>,
): Promise<() => OpenAPIObject> {
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
        .setLicense('AGPL-3.0', 'https://github.com/remnawave/panel?tab=AGPL-3.0-1-ov-file')
        .addGlobalResponse({
            status: 404,
            description: 'Resource not found',

            content: {
                'application/json': {
                    schema: { $ref: getSchemaPath(RemnawaveNotFoundErrorDto) },
                },
            },
        })
        .addGlobalResponse({
            status: 400,
            description: 'Bad request / Validation error',

            content: {
                'application/json': {
                    schema: {
                        oneOf: [
                            { $ref: getSchemaPath(RemnawaveBadRequestErrorDto) },
                            { $ref: getSchemaPath(RemnawaveValidationErrorDto) },
                        ],
                    },
                },
            },
        })
        .addGlobalResponse({
            status: 500,
            description: 'Internal server error',

            content: {
                'application/json': {
                    schema: { $ref: getSchemaPath(RemnawaveInternalServerErrorDto) },
                },
            },
        });

    Object.values(CONTROLLERS_INFO).reduce((builder, { tag, description }) => {
        return builder.addTag(tag, description);
    }, configSwagger);

    const builtConfigSwagger = configSwagger.build();

    return () =>
        cleanupOpenApiDoc(
            SwaggerModule.createDocument(app, builtConfigSwagger, {
                extraModels: [
                    RemnawaveWebhookUserEventsDto,
                    RemnawaveWebhookUserHwidDevicesEventsDto,
                    RemnawaveWebhookNodeEventsDto,
                    RemnawaveWebhookServiceEventsDto,
                    RemnawaveWebhookErrorsEventsDto,
                    RemnawaveWebhookCrmEventsDto,
                    RemnawaveWebhookTorrentBlockerEventsDto,
                    RemnawaveNotFoundErrorDto,
                    RemnawaveBadRequestErrorDto,
                    RemnawaveInternalServerErrorDto,
                    RemnawaveValidationErrorDto,
                    RemnawaveUserUsageStreamMessageDto,
                    RemnawaveSubscriptionRequestStreamMessageDto,
                    RemnawaveNodeConnectionsStreamMessageDto,
                ],
            }),
        );
}
