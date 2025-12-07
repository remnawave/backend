import { TUserEvents } from '@libs/contracts/constants';

import { IMetaInfo } from '@integration-modules/notifications/interfaces/meta-info.interface';

export interface IFireUserEventPayload {
    users: { tId: bigint }[];
    userEvent: TUserEvents;
    skipTelegramNotification?: boolean;
    meta?: IMetaInfo;
}

export interface IFireUserEventJobData {
    tId: string;
    meta?: IMetaInfo;
    userEvent: TUserEvents;
    skipTelegramNotification?: boolean;
}
