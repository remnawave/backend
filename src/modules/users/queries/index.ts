import { GetUserWithResolvedInboundsHandler } from './get-user-with-resolved-inbounds';
import { GetPreparedConfigWithUsersHandler } from './get-prepared-config-with-users';
import { GetUsersWithPaginationHandler } from './get-users-with-pagination';
import { GetUserByUniqueFieldHandler } from './get-user-by-unique-field';
import { GetUsersByExpireAtHandler } from './get-users-by-expire-at';
import { GetShortUserStatsHandler } from './get-short-user-stats';
import { GetUuidByUsernameHandler } from './get-uuid-by-username';

export const QUERIES = [
    GetUserByUniqueFieldHandler,

    GetUserWithResolvedInboundsHandler,
    GetShortUserStatsHandler,

    GetPreparedConfigWithUsersHandler,
    GetUsersByExpireAtHandler,
    GetUsersWithPaginationHandler,

    GetUuidByUsernameHandler,
];
