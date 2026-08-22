import { apiReference } from '@scalar/nestjs-api-reference';
import fs from 'node:fs';
import { SwaggerThemeNameEnum } from 'swagger-themes';
import { SwaggerTheme } from 'swagger-themes';

import { INestApplication, Logger } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger';

import { ROOT, SCALAR_ROOT, SWAGGER_ROOT } from '@libs/contracts/api';

import { createOpenApiDocumentFactory } from './build-openapi-document';
import { getOpenApiSpecPath } from './get-openapi-spec-path';

const logger = new Logger('Docs');

const readPrebuiltDocument = (): null | OpenAPIObject => {
    const specPath = getOpenApiSpecPath();

    if (!fs.existsSync(specPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(specPath, 'utf8')) as OpenAPIObject;
    } catch (error) {
        logger.warn(`Failed to read prebuilt OpenAPI spec at ${specPath}: ${error}`);

        return null;
    }
};

export async function getDocs(app: INestApplication<unknown>) {
    const buildDocument = await createOpenApiDocumentFactory(app);

    let cachedDocument: null | OpenAPIObject = null;

    const getDocument = (): OpenAPIObject => {
        if (cachedDocument) {
            return cachedDocument;
        }

        const prebuilt = readPrebuiltDocument();

        if (prebuilt) {
            logger.log('Using prebuilt OpenAPI spec.');
            cachedDocument = prebuilt;
        } else {
            logger.log('Prebuilt OpenAPI spec is not available, building the document.');
            cachedDocument = buildDocument();
        }

        return cachedDocument;
    };

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

    SwaggerModule.setup(SWAGGER_ROOT, app, getDocument, options);

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
            url: `${ROOT}${SWAGGER_ROOT}-json`,
        }),
    );
}
