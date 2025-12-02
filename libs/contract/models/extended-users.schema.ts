import { z } from 'zod';

import { BaseInternalSquadSchema } from './base-internal-squad.schema';
import { UserTrafficSchema } from './user-traffic.schema';
import { UsersSchema } from './users.schema';

export const ExtendedUsersSchema = UsersSchema.extend({
    subscriptionUrl: z.string(),
    activeInternalSquads: z.array(BaseInternalSquadSchema),
    userTraffic: UserTrafficSchema,
});
