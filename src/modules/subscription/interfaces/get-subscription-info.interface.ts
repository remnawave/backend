import { ExternalSquadEntity } from '@modules/external-squads/entities/external-squad.entity';
import { SubscriptionSettingsEntity } from '@modules/subscription-settings';
import { UserEntity } from '@modules/users/entities';

export interface IGetSubscriptionInfo {
    userEntity?: UserEntity;
    searchBy?: {
        uniqueField: string;
        uniqueFieldKey: 'username' | 'shortUuid' | 'uuid';
    };
    authenticated?: boolean;
    subscriptionSettingsRaw?: SubscriptionSettingsEntity;
    overrides?: {
        subscriptionSettings: SubscriptionSettingsEntity;
        hostsOverrides?: ExternalSquadEntity['hostOverrides'];
    } | null;
}
