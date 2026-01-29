import { TServiceEvents, TCrudActions } from '@libs/contracts/constants';

export interface IServiceEvent {
    loginAttempt?: {
        username: string;
        ip: string;
        userAgent: string;
        description?: string;
        password?: string;
    };
    panelVersion?: string;
    subpageConfig?: {
        action: TCrudActions;
        uuid: string;
    };
}

export class ServiceEvent {
    eventName: TServiceEvents;
    data: IServiceEvent;

    constructor(event: TServiceEvents, data: IServiceEvent) {
        this.eventName = event;
        this.data = data;
    }
}
