export class RemoveUserFromNodeEvent {
    constructor(
        public readonly tId: bigint,
        public readonly vlessUuid: string,
    ) {}
}
