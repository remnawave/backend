import { transliterate } from 'transliteration';
import dayjs from 'dayjs';

import { TemplateKeys } from '@libs/contracts/constants/templates/template-keys';
import { USER_STATUSES_TEMPLATE } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities';

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

    static formatWithUser(
        template: string,
        user: UserEntity,
        subPublicDomain: string,
        forHeader: boolean = false,
    ): string {
        return this.replace(template, {
            DAYS_LEFT: Math.max(0, dayjs(user.expireAt).diff(dayjs(), 'day')),
            TRAFFIC_USED: prettyBytesUtil(user.usedTrafficBytes, true, 3),
            TRAFFIC_LEFT: prettyBytesUtil(user.trafficLimitBytes - user.usedTrafficBytes, true, 3),
            TOTAL_TRAFFIC: prettyBytesUtil(user.trafficLimitBytes, true, 3),
            STATUS: forHeader
                ? transliterate(USER_STATUSES_TEMPLATE[user.status])
                : USER_STATUSES_TEMPLATE[user.status],
            USERNAME: user.username,
            EMAIL: user.email || '',
            TELEGRAM_ID: user.telegramId?.toString() || '',
            SUBSCRIPTION_URL: `https://${subPublicDomain}/${user.shortUuid}`,
            TAG: user.tag || '',
            EXPIRE_UNIX: dayjs(user.expireAt).unix(),
            SHORT_UUID: user.shortUuid,
        });
    }
}
