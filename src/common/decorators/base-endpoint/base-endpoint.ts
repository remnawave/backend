/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import {
    applyDecorators,
    Patch,
    Delete,
    Put,
    All,
    Post,
    Get,
    HttpCode,
    Type,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiInternalServerErrorResponse,
    ApiOperation,
} from '@nestjs/swagger';

import { EndpointDetails, ERRORS } from '@libs/contracts/constants';

interface ApiEndpointOptions {
    command: { endpointDetails: EndpointDetails };
    httpCode: number;
    apiBody?: string | Function | Type<unknown> | [Function] | undefined;
}

export function Endpoint(options: ApiEndpointOptions) {
    const method = options.command.endpointDetails.REQUEST_METHOD.toLowerCase();

    const apiBody = options.apiBody ? ApiBody({ type: options.apiBody }) : undefined;

    return applyDecorators(
        resolveRequestMethod(method)(options.command.endpointDetails.CONTROLLER_URL),
        HttpCode(options.httpCode),
        ApiOperation({
            summary: options.command.endpointDetails.METHOD_DESCRIPTION,
            description: options.command.endpointDetails.METHOD_LONG_DESCRIPTION,
        }),
        ApiInternalServerErrorResponse({
            description: ERRORS.INTERNAL_SERVER_ERROR.message,
            schema: {
                type: 'object',
                properties: {
                    timestamp: { type: 'string' },
                    path: { type: 'string' },
                    message: { type: 'string' },
                    errorCode: { type: 'string' },
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Validation error',
            schema: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    statusCode: { type: 'number', example: 400 },
                    errors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                validation: { type: 'string', example: 'uuid' },
                                code: { type: 'string', example: 'invalid_string' },
                                message: { type: 'string', example: 'Invalid uuid' },
                                path: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['uuid'],
                                },
                            },
                            required: ['validation', 'code', 'message', 'path'],
                        },
                        example: [
                            {
                                validation: 'uuid',
                                code: 'invalid_string',
                                message: 'Invalid uuid',
                                path: ['uuid'],
                            },
                        ],
                    },
                },
            },
        }),
        ...(apiBody ? [apiBody] : []),
    );
}

function resolveRequestMethod(method: string) {
    switch (method) {
        case 'get':
            return Get;
        case 'post':
            return Post;
        case 'put':
            return Put;
        case 'delete':
            return Delete;
        case 'patch':
            return Patch;
        default:
            return All;
    }
}
