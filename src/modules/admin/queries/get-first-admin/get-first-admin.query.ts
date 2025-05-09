import { TRoleTypes } from '@libs/contracts/constants';

export class GetFirstAdminQuery {
    constructor(public readonly role: TRoleTypes) {}
}
