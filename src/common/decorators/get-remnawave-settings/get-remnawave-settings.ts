import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

export const GetRemnawaveSettings = createParamDecorator<RemnawaveSettingsEntity>(
    (data: unknown, ctx: ExecutionContext): RemnawaveSettingsEntity => {
        const request = ctx.switchToHttp().getRequest();
        return request.remnawaveSettings;
    },
);
