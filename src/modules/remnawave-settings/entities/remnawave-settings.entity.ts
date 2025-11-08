import { RemnawaveSettings } from '@prisma/client';

import {
    TBrandingSettings,
    TOauth2Settings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
    TTgAuthSettings,
} from '@libs/contracts/models';

export class RemnawaveSettingsEntity implements RemnawaveSettings {
    public id: number;
    public passkeySettings: TRemnawavePasskeySettings;
    public oauth2Settings: TOauth2Settings;
    public tgAuthSettings: TTgAuthSettings;
    public passwordSettings: TPasswordAuthSettings;
    public brandingSettings: TBrandingSettings;

    constructor(remnawaveSettings: Partial<RemnawaveSettings>) {
        Object.assign(this, remnawaveSettings);
        return this;
    }
}
