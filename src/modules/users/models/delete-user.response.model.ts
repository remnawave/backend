export class DeleteUserResponseModel {
    public readonly isDeleted: boolean;

    constructor(isDeleted: boolean) {
        this.isDeleted = isDeleted;
    }
}
