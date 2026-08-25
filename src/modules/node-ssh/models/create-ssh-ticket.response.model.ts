export class CreateSshTicketResponseModel {
    public readonly ticket: string;
    public readonly path: string;
    public readonly expiresInSeconds: number;

    constructor(data: CreateSshTicketResponseModel) {
        this.ticket = data.ticket;
        this.path = data.path;
        this.expiresInSeconds = data.expiresInSeconds;
    }
}
