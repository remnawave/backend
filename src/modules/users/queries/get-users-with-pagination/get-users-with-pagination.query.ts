export class GetUsersWithPaginationQuery {
    constructor(
        public readonly start: number,
        public readonly size: number,
    ) {}
}
