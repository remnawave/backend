import { apiReference } from '@scalar/nestjs-api-reference';
import { SwaggerThemeNameEnum } from 'swagger-themes';
import { SwaggerTheme } from 'swagger-themes';
import { readPackageJSON } from 'pkg-types';

import { DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { CONTROLLERS_INFO } from '@libs/contracts/api';

import {
    RemnawaveWebhookCrmEventsDto,
    RemnawaveWebhookErrorsEventsDto,
    RemnawaveWebhookNodeEventsDto,
    RemnawaveWebhookServiceEventsDto,
    RemnawaveWebhookUserEventsDto,
    RemnawaveWebhookUserHwidDevicesEventsDto,
} from './extra-models';

const description = `
Remnawave is a powerful proxy management tool, built on top of Xray-core, with a focus on simplicity and ease of use.

## Resources
* https://t.me/remnawave
* https://github.com/remnawave
* https://docs.rw
`;

export async function getDocs(app: INestApplication<unknown>, config: ConfigService) {
    const isSwaggerEnabled = config.getOrThrow<string>('IS_DOCS_ENABLED');

    if (isSwaggerEnabled === 'true') {
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

        const theme = new SwaggerTheme();
        const options = {
            explorer: false,
            customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
            customSiteTitle: 'Remnawave API Schema',
            swaggerOptions: {
                persistAuthorization: true,
            },
        };

        SwaggerModule.setup(
            config.getOrThrow<string>('SWAGGER_PATH'),
            app,
            documentFactory,
            options,
        );

        app.use(
            config.getOrThrow<string>('SCALAR_PATH'),

            apiReference({
                orderSchemaPropertiesBy: 'preserve',
                orderRequiredPropertiesFirst: true,
                showSidebar: true,
                layout: 'modern',
                hideModels: false,
                hideDownloadButton: false,
                hideTestRequestButton: false,
                isEditable: false,
                isLoading: false,
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
                    'httr',
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

                content: documentFactory,
            }),
        );
    }
}
