import { ZodValidationException } from 'nestjs-zod';
import { Request, Response } from 'express';

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';

import { HttpExceptionWithErrorCodeType } from './http-exeception-with-error-code.type';

@Catch()
export class CatchAllExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(CatchAllExceptionFilter.name);

    catch(exception: HttpExceptionWithErrorCodeType | ZodValidationException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception?.getStatus();

        let errorMessage: string | string[];
        let errorCode: string = 'E000';
        if (status === HttpStatus.FORBIDDEN) {
            errorMessage = 'Forbidden';
        } else {
            errorMessage = exception.message;
            if (exception instanceof HttpExceptionWithErrorCodeType) {
                errorCode = exception.errorCode;
            }
        }

        if (exception instanceof ZodValidationException) {
            this.logger.error({
                timestamp: new Date().toISOString(),
                code: errorCode,
                path: request.url,
                message: '[ZodValidationException] ' + JSON.stringify(exception.getResponse()),
            });

            response.status(status).json(exception.getResponse());
        } else {
            response.status(status).json({
                timestamp: new Date().toISOString(),
                path: request.url,
                message: errorMessage,
                errorCode,
            });
        }
    }
}
