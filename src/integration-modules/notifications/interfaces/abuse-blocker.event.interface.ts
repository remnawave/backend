import type { AbuseBlockerReportModel } from '@remnawave/node-contract';

import { TAbuseBlockerEvents } from '@libs/contracts/constants';

import { NodesEntity } from '@modules/nodes/entities/nodes.entity';
import { UserEntity } from '@modules/users/entities';

type AbuseBlockerBackendAction = 'none' | 'initial_block' | 'repeat_block' | 'disabled';

export class AbuseBlockerEvent {
    constructor(
        public readonly data: {
            node: NodesEntity;
            user: UserEntity;
            report: AbuseBlockerReportModel;
            backendAction: AbuseBlockerBackendAction;
            strikeLevel: number;
        },
        public readonly eventName: TAbuseBlockerEvents,
    ) {}
}
