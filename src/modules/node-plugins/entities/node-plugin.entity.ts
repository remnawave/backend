import { NodePlugin } from '@prisma/client';

export class NodePluginEntity implements NodePlugin {
    uuid: string;
    viewPosition: number;
    name: string;
    pluginConfig: object;

    createdAt: Date;
    updatedAt: Date;
    constructor(plugin: Partial<NodePlugin>) {
        Object.assign(this, plugin);
        return this;
    }
}
