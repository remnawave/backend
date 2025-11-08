import {
    TBrandingSettings,
    TOauth2Settings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
    TTgAuthSettings,
} from '@libs/contracts/models';

import { RemnawaveSettingsEntity } from '../entities';

export class RemnawaveSettingsResponseModel {
    public passkeySettings: TRemnawavePasskeySettings;
    public oauth2Settings: TOauth2Settings;
    public tgAuthSettings: TTgAuthSettings;
    public passwordSettings: TPasswordAuthSettings;
    public brandingSettings: TBrandingSettings;

    constructor(entity: RemnawaveSettingsEntity) {
        this.passkeySettings = entity.passkeySettings;
        this.oauth2Settings = entity.oauth2Settings;
        this.tgAuthSettings = entity.tgAuthSettings;
        this.passwordSettings = entity.passwordSettings;
        this.brandingSettings = entity.brandingSettings;
    }
}
