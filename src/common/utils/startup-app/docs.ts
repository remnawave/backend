import { apiReference } from '@scalar/nestjs-api-reference';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { readPackageJSON } from 'pkg-types';
import { SwaggerThemeNameEnum } from 'swagger-themes';
import { SwaggerTheme } from 'swagger-themes';

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, getSchemaPath } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger';

import { CONTROLLERS_INFO, ROOT, SCALAR_ROOT, SWAGGER_ROOT } from '@libs/contracts/api';

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

export async function getDocs(app: INestApplication<unknown>) {
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

    const documentFactory = () =>
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
        });

    const document = documentFactory();

    const theme = new SwaggerTheme();
    const options = {
        explorer: false,
        customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
        customSiteTitle: 'Remnawave API Schema',
        swaggerOptions: {
            persistAuthorization: true,
        },
        useGlobalPrefix: true,
    };

    SwaggerModule.setup(SWAGGER_ROOT, app, cleanupOpenApiDoc(document), options);

    app.use(
        `${ROOT}${SCALAR_ROOT}`,
        apiReference({
            orderSchemaPropertiesBy: 'preserve',
            orderRequiredPropertiesFirst: true,
            showSidebar: true,
            layout: 'modern',
            hideModels: false,
            hideDownloadButton: false,
            hideTestRequestButton: false,
            isEditable: false,
            hideDarkModeToggle: false,
            withDefaultFonts: true,
            hideSearch: false,
            theme: 'purple',
            hideClientButton: false,
            darkMode: true,
            persistAuth: true,
            hiddenClients: [
                'asynchttp',
                'nethttp',
                'okhttp',
                'unirest',
                'nsurlsession',
                'native',
                'libcurl',
                'httpclient',
                'restsharp',
                'clj_http',
                'webrequest',
                'restmethod',
                'cohttp',
            ],
            defaultHttpClient: {
                targetKey: 'js',
                clientKey: 'axios',
            },
            telemetry: false,
            content: () => cleanupOpenApiDoc(document),
        }),
    );
}
