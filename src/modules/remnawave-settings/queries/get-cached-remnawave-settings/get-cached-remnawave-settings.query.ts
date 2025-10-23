import { Query } from '@nestjs/cqrs';

import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

export class GetCachedRemnawaveSettingsQuery extends Query<RemnawaveSettingsEntity> {
    constructor() {
        super();
    }
}
