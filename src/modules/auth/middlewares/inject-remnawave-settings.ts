import { Request, Response, NextFunction } from 'express';

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetCachedRemnawaveSettingsQuery } from '@modules/remnawave-settings/queries/get-cached-remnawave-settings/get-cached-remnawave-settings.query';
import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

@Injectable()
export class InjectRemnawaveSettingsMiddleware implements NestMiddleware {
    private readonly logger = new Logger(InjectRemnawaveSettingsMiddleware.name);
    constructor(private readonly queryBus: QueryBus) {}

    async use(
        req: { remnawaveSettings: RemnawaveSettingsEntity } & Request,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const remnawaveSettings = await this.queryBus.execute(
                new GetCachedRemnawaveSettingsQuery(),
            );

            req.remnawaveSettings = remnawaveSettings;

            next();
        } catch (error) {
            next(error);
        }
    }
}
