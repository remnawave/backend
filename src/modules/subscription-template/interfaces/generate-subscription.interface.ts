import { ExternalSquadEntity } from '@modules/external-squads/entities/external-squad.entity';
import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { ISRRContext } from '@modules/subscription-response-rules/interfaces';
import { UserEntity } from '@modules/users/entities/user.entity';

export interface IGenerateSubscription {
    srrContext: ISRRContext;
    user: UserEntity;
    hosts: HostWithRawInbound[];
    hostsOverrides?: ExternalSquadEntity['hostOverrides'];
}
