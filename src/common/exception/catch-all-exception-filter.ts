import { ZodValidationException } from 'nestjs-zod';
import { Request, Response } from 'express';

import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';

import { HttpExceptionWithErrorCodeType } from './http-exeception-with-error-code.type';

@Catch()
export class CatchAllExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(CatchAllExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (exception instanceof HttpException) {
            status = exception.getStatus();
        }

        let errorMessage: string | string[] = 'Internal server error';
        let errorCode: string = 'E000';

        if (status === HttpStatus.FORBIDDEN) {
            errorMessage = 'Forbidden';
        } else if (exception instanceof Error) {
            errorMessage = exception.message;
        }

        if (exception instanceof HttpExceptionWithErrorCodeType) {
            errorCode = exception.errorCode;
        } else if (exception instanceof UnauthorizedException) {
            errorCode = 'E401';
        } else if (exception instanceof ForbiddenException) {
            errorCode = 'E403';
        }

        if (exception instanceof ZodValidationException) {
            this.logger.error({
                timestamp: new Date().toISOString(),
                code: errorCode,
                path: request.url,
                message: '[ZodValidationException] ' + JSON.stringify(exception.getResponse()),
            });

            response.status(status).json(exception.getResponse());
            return;
        }

        if (
            exception instanceof HttpExceptionWithErrorCodeType ||
            exception instanceof HttpException
        ) {
            response.status(status).json({
                timestamp: new Date().toISOString(),
                path: request.url,
                message: errorMessage,
                errorCode,
            });
            return;
        }

        this.logger.error(exception);

        response.status(status).json({
            timestamp: new Date().toISOString(),
            path: request.url,
            message: 'Internal server error',
            errorCode: 'E500',
        });
    }
}
