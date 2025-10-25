import { FindPasskeyByIdAndAdminUuidHandler } from './find-passkey-by-id-and-uuid';
import { GetPasskeysByAdminUuidHandler } from './get-passkeys-by-admin-uuid';
import { GetAdminByUsernameHandler } from './get-admin-by-username';
import { CountAdminsByRoleHandler } from './count-admins-by-role';
import { GetAdminByUuidHandler } from './get-admin-by-uuid';
import { GetFirstAdminHandler } from './get-first-admin';

export const QUERIES = [
    GetAdminByUsernameHandler,
    CountAdminsByRoleHandler,
    GetFirstAdminHandler,
    GetAdminByUuidHandler,
    GetPasskeysByAdminUuidHandler,
    FindPasskeyByIdAndAdminUuidHandler,
];
