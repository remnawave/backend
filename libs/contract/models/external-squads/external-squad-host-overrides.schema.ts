import { HostsSchema } from '../hosts.schema';

export const ExternalSquadHostOverridesSchema = HostsSchema.pick({
    serverDescription: true,
    vlessRouteId: true,
}).partial();
