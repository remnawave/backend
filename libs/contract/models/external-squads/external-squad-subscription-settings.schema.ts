import { SubscriptionSettingsSchema } from '../subscription-settings.schema';

export const ExternalSquadSubscriptionSettingsSchema = SubscriptionSettingsSchema.pick({
    profileTitle: true,
    supportLink: true,
    profileUpdateInterval: true,
    isProfileWebpageUrlEnabled: true,
    serveJsonAtBaseSubscription: true,
    addUsernameToBaseSubscription: true,
    isShowCustomRemarks: true,
    happAnnounce: true,
    happRouting: true,
    randomizeHosts: true,
}).partial();
