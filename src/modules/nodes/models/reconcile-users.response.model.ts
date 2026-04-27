export interface ReconcileUserChange {
    username: string;
    tags: string[];
}

export interface ReconcileUserError {
    username: string;
    tag: string;
    phase: 'add' | 'remove';
    error: string;
}

export class ReconcileUsersResponseModel {
    public nodeUuid: string;
    public added: ReconcileUserChange[];
    public removed: ReconcileUserChange[];
    public errors: ReconcileUserError[];
    public unreachableTags: string[];
    public skipped: boolean;
    public skipReason: string | null;

    constructor(data: {
        nodeUuid: string;
        added: ReconcileUserChange[];
        removed: ReconcileUserChange[];
        errors: ReconcileUserError[];
        unreachableTags: string[];
        skipped: boolean;
        skipReason: string | null;
    }) {
        this.nodeUuid = data.nodeUuid;
        this.added = data.added;
        this.removed = data.removed;
        this.errors = data.errors;
        this.unreachableTags = data.unreachableTags;
        this.skipped = data.skipped;
        this.skipReason = data.skipReason;
    }
}
