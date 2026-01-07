export class RemoveUsersFromNodeEvent {
    constructor(
        public readonly users: {
            tId: bigint;
            vlessUuid: string;
        }[],
    ) {}
}
