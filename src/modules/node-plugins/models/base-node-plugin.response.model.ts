import { TNodePlugin } from 'libs/node-plugins';

import { NodePluginEntity } from '../entities/node-plugin.entity';

export class BaseNodePluginResponseModel {
    public uuid: string;
    public viewPosition: number;
    public name: string;
    public pluginConfig: object | null;

    constructor(entity: NodePluginEntity) {
        this.uuid = entity.uuid;
        this.viewPosition = entity.viewPosition;
        this.name = entity.name;
        if (entity.pluginConfig) {
            this.pluginConfig = entity.pluginConfig as unknown as TNodePlugin;
        } else {
            this.pluginConfig = null;
        }
    }
}
