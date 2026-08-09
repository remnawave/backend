export class IssueCertificateCommand {
    constructor(
        public readonly certificateUuid: string,
        public readonly force: boolean = false,
    ) {}
}
