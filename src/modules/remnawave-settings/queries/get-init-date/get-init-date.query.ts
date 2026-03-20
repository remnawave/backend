import { Query } from '@nestjs/cqrs';

export class GetInitDateQuery extends Query<Date> {
    constructor() {
        super();
    }
}
