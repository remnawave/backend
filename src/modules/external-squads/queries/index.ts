import { GetCachedExternalSquadSettingsHandler } from './get-cached-external-squad-settings';
import { GetExternalSquadSettingsHandler } from './get-external-squad-settings';
import { GetTemplateNameHandler } from './get-template-name';

export const QUERIES = [
    GetTemplateNameHandler,
    GetExternalSquadSettingsHandler,
    GetCachedExternalSquadSettingsHandler,
];
