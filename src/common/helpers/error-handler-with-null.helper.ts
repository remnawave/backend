import { errorHandler } from '@common/helpers/error-handler.helper';

import { TResult } from '../types/result.type';

export function errorHandlerWithNull<T>(response: TResult<T>): null | T {
    if (response.isOk) {
        if (!response.response) {
            return null;
        }
        return errorHandler(response);
    } else {
        return errorHandler(response);
    }
}
