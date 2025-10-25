import { TUserEvents } from '@libs/contracts/constants';

import { UserEntity } from '@modules/users/entities';

import { IMetaInfo } from './meta-info.interface';

interface UserEventConstructorArgs {
    user: UserEntity;
    event: TUserEvents;
    meta?: IMetaInfo;
    skipTelegramNotification?: boolean;
}

export class UserEvent {
    user: UserEntity;
    meta?: IMetaInfo;
    eventName: TUserEvents;
    skipTelegramNotification?: boolean;

    constructor(eventArgs: UserEventConstructorArgs) {
        this.user = eventArgs.user;
        this.meta = eventArgs.meta;
        this.eventName = eventArgs.event;
        this.skipTelegramNotification = eventArgs.skipTelegramNotification ?? false;
    }
}
