import { InternalServerErrorException } from '@nestjs/common';

import { ERRORS } from '@libs/contracts/constants/errors';

import { HttpExceptionWithErrorCodeType } from '../exception/http-exeception-with-error-code.type';
import { TResult } from '../types/result.type';

const ERROR_BY_CODE = new Map<string, (typeof ERRORS)[keyof typeof ERRORS]>(
    Object.values(ERRORS).map((error) => [error.code, error]),
);

export function errorHandler<T>(response: TResult<T>): T {
    if (response.isOk) {
        return response.response;
    } else {
        if (!response.code) {
            throw new InternalServerErrorException('Unknown error');
        }
        const errorObject = ERROR_BY_CODE.get(response.code);

        if (!errorObject) {
            throw new InternalServerErrorException('Unknown error');
        }
        throw new HttpExceptionWithErrorCodeType(
            response.message || errorObject.message,
            errorObject.code,
            errorObject.httpCode,
        );
    }
}
