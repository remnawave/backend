import { Request, Response, NextFunction } from 'express';

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { HttpExceptionWithErrorCodeType } from '@common/exception/http-exeception-with-error-code.type';
import { ERRORS } from '@libs/contracts/constants';

import { GetCachedShortUuidRangeQuery } from '@modules/users/queries/get-cached-short-uuid-range';

@Injectable()
export class ValidateShortUuidMiddleware implements NestMiddleware {
    private readonly logger = new Logger(ValidateShortUuidMiddleware.name);
    private readonly FILE_EXTENSION_PATTERN = /\..{0,4}$/;

    constructor(private readonly queryBus: QueryBus) {}

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const shortUuid = req.params.shortUuid;

            if (
                !shortUuid ||
                shortUuid.startsWith('.') ||
                this.FILE_EXTENSION_PATTERN.test(shortUuid)
            ) {
                this.throwForbiddenError();
            }

            const { min, max } = await this.queryBus.execute(new GetCachedShortUuidRangeQuery());

            if (shortUuid.length < min || shortUuid.length > max) {
                this.throwForbiddenError();
            }

            next();
        } catch (error) {
            next(error);
        }
    }

    private throwForbiddenError(): never {
        throw new HttpExceptionWithErrorCodeType(
            ERRORS.FORBIDDEN.message,
            ERRORS.FORBIDDEN.code,
            ERRORS.FORBIDDEN.httpCode,
        );
    }
}
