import {
    TBrandingSettings,
    TOauth2Settings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
} from '@libs/contracts/models';

import { RemnawaveSettingsEntity } from '../entities';

export class RemnawaveSettingsResponseModel {
    public passkeySettings: TRemnawavePasskeySettings;
    public oauth2Settings: TOauth2Settings;
    public passwordSettings: TPasswordAuthSettings;
    public brandingSettings: TBrandingSettings;

    constructor(entity: RemnawaveSettingsEntity) {
        this.passkeySettings = entity.passkeySettings;
        this.oauth2Settings = entity.oauth2Settings;
        this.passwordSettings = entity.passwordSettings;
        this.brandingSettings = entity.brandingSettings;
    }
}
