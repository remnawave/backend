import { z } from 'zod';

import {
    BrandingSettingsSchema,
    Oauth2SettingsSchema,
    PasskeySettingsSchema,
    PasswordAuthSettingsSchema,
    RemnawaveSettingsSchema,
    TgAuthSettingsSchema,
} from '../../models';
import { REMNAAWAVE_SETTINGS_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace UpdateRemnawaveSettingsCommand {
    export const url = REST_API.REMNAAWAVE_SETTINGS.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        REMNAAWAVE_SETTINGS_ROUTES.UPDATE,
        'patch',
        'Update Remnawave settings',
    );

    export const RequestSchema = z.object({
        passkeySettings: PasskeySettingsSchema.optional(),
        oauth2Settings: Oauth2SettingsSchema.optional(),
        tgAuthSettings: TgAuthSettingsSchema.optional(),
        passwordSettings: PasswordAuthSettingsSchema.optional(),
        brandingSettings: BrandingSettingsSchema.optional(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: RemnawaveSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
