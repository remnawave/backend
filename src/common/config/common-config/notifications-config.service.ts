import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import { TAllEventChannels, TAllEvents } from '@libs/contracts/constants';

import { NotificationsConfig } from '../app-config';

@Injectable()
export class NotificationsConfigService {
    private readonly config: NotificationsConfig;

    constructor(private readonly configService: ConfigService) {
        this.config = this.configService.getOrThrow<NotificationsConfig>('notifications');
    }

    isEnabled(eventName: TAllEvents, channel: TAllEventChannels): boolean {
        const eventConfig = this.config.events[eventName];

        if (eventConfig) {
            return eventConfig[channel];
        }

        return true;
    }
}
