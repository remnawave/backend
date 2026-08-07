import { TypedConfigService } from '@common/config/app-config';

export function getRedisChannelName(configService: TypedConfigService, channel: string): string {
    return `${configService.get('REDIS_KEY_PREFIX') ?? ''}${channel}`;
}
