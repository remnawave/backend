import { GetAdminByUsernameHandler } from './get-admin-by-username';
import { CountAdminsByRoleHandler } from './count-admins-by-role';
import { GetFirstAdminHandler } from './get-first-admin';

export const QUERIES = [GetAdminByUsernameHandler, CountAdminsByRoleHandler, GetFirstAdminHandler];
