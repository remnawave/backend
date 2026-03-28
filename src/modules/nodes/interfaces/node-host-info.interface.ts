import { TNodeSystemInfo, TNodeSystemStats } from '@libs/contracts/models/node-system.schema';

export interface INodeSystem {
    info: TNodeSystemInfo;
    stats: TNodeSystemStats;
}
