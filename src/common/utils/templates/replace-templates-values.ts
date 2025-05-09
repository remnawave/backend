import dayjs from 'dayjs';

import { TemplateKeys } from '@libs/contracts/constants/templates/template-keys';
import { USER_STATUSES_TEMPLATE } from '@libs/contracts/constants';

import { UserWithActiveInboundsEntity } from '@modules/users/entities/user-with-active-inbounds.entity';

import { prettyBytesUtil } from '../bytes';

type TemplateValues = {
    [key in TemplateKeys]: number | string | undefined;
};

export class TemplateEngine {
    static replace(template: string, values: TemplateValues): string {
        let hasReplacement = false;
        const result = template.replace(/\{\{(\w+)\}\}/g, (match, key: TemplateKeys) => {
            if (values[key] !== undefined) {
                hasReplacement = true;
                return values[key]?.toString() || '';
            }
            return match;
        });

        return hasReplacement ? result : template;
    }

    static formarWithUser(
        template: string,
        user: UserWithActiveInboundsEntity,
        subPublicDomain: string,
    ): string {
        return this.replace(template, {
            DAYS_LEFT: dayjs(user.expireAt).diff(dayjs(), 'day'),
            TRAFFIC_USED: prettyBytesUtil(user.usedTrafficBytes, true, 3),
            TRAFFIC_LEFT: prettyBytesUtil(user.trafficLimitBytes - user.usedTrafficBytes, true, 3),
            TOTAL_TRAFFIC: prettyBytesUtil(user.trafficLimitBytes, true, 3),
            STATUS: USER_STATUSES_TEMPLATE[user.status],
            USERNAME: user.username,
            EMAIL: user.email || '',
            TELEGRAM_ID: user.telegramId?.toString() || '',
            SUBSCRIPTION_URL: `https://${subPublicDomain}/${user.shortUuid}`,
        });
    }
}
