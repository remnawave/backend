export class GetSubscriptionUrlQuery {
    constructor(
        public readonly userShortUuid: string,
        public readonly username: string,
    ) {}
}
