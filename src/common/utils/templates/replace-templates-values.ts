import { transliterate } from 'transliteration';
import dayjs from 'dayjs';

import { TemplateKeys } from '@libs/contracts/constants/templates/template-keys';
import { USER_STATUSES_TEMPLATE } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities';

import { prettyBytesUtil } from '../bytes';

type TemplateValueGetter = () => string | number;
type LazyTemplateValues = {
    [key in TemplateKeys]: TemplateValueGetter;
};

export class TemplateEngine {
    private static readonly TEMPLATE_REGEX = /\{\{(\w+)\}\}/g;

    static replace(template: string, values: LazyTemplateValues): string {
        let hasReplacement = false;

        const result = template.replace(this.TEMPLATE_REGEX, (match, key: TemplateKeys) => {
            const getter = values[key];
            if (getter !== undefined) {
                hasReplacement = true;
                return getter()?.toString() ?? '';
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
        const trafficLeft = () => user.trafficLimitBytes - user.userTraffic.usedTrafficBytes;

        return this.replace(template, {
            DAYS_LEFT: () => Math.max(0, dayjs(user.expireAt).diff(dayjs(), 'day')),
            TRAFFIC_USED: () => prettyBytesUtil(user.userTraffic.usedTrafficBytes, true, 3),
            TRAFFIC_LEFT: () => prettyBytesUtil(trafficLeft(), true, 3),
            TOTAL_TRAFFIC: () => prettyBytesUtil(user.trafficLimitBytes, true, 3),
            STATUS: () =>
                forHeader
                    ? transliterate(USER_STATUSES_TEMPLATE[user.status])
                    : USER_STATUSES_TEMPLATE[user.status],
            USERNAME: () => user.username,
            EMAIL: () => user.email || '',
            TELEGRAM_ID: () => user.telegramId?.toString() || '',
            SUBSCRIPTION_URL: () => `https://${subPublicDomain}/${user.shortUuid}`,
            TAG: () => user.tag || '',
            EXPIRE_UNIX: () => dayjs(user.expireAt).unix(),
            SHORT_UUID: () => user.shortUuid,
            ID: () => user.tId.toString(),
            TRAFFIC_USED_BYTES: () => user.userTraffic.usedTrafficBytes.toString(),
            TRAFFIC_LEFT_BYTES: () => trafficLeft().toString(),
            TOTAL_TRAFFIC_BYTES: () => user.trafficLimitBytes.toString(),
        });
    }
}
