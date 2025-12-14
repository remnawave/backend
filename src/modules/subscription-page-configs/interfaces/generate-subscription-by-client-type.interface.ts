import { TSubscriptionTemplateType } from '@libs/contracts/constants';

import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { UserEntity } from '@modules/users/entities';

export interface IGenerateSubscriptionByClientType {
    userAgent: string;
    user: UserEntity;
    hosts: HostWithRawInbound[];
    clientType: TSubscriptionTemplateType;
}
