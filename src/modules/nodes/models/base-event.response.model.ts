export class BaseEventResponseModel {
    public eventSent: boolean;

    constructor(eventSent: boolean) {
        this.eventSent = eventSent;
    }
}
