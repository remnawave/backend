import { Query } from '@nestjs/cqrs';

export class GetCachedShortUuidRangeQuery extends Query<{
    min: number;
    max: number;
}> {
    constructor(public readonly forceRefresh: boolean = false) {
        super();
    }
}
