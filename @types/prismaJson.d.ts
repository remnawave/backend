import { z } from 'zod';

import {
    Oauth2SettingsSchema,
    PasskeySettingsSchema,
    PasswordAuthSettingsSchema,
    BrandingSettingsSchema,
    NodeIpsSchema,
} from '@libs/contracts/models';

declare global {
    namespace PrismaJson {
        type PasskeySettings = z.infer<typeof PasskeySettingsSchema>;
        type Oauth2Settings = z.infer<typeof Oauth2SettingsSchema>;
        type PasswordAuthSettings = z.infer<typeof PasswordAuthSettingsSchema>;
        type BrandingSettings = z.infer<typeof BrandingSettingsSchema>;
        type NodeIps = z.infer<typeof NodeIpsSchema>;
    }
}

export {};
