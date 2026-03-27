import { CACHE_KEYS } from '@contract/constants';

import { Injectable } from '@nestjs/common';

import { RawCacheService } from '@common/raw-cache';

import { INodeHotCache, INodeSystem, INodeVersions } from './interfaces';

@Injectable()
export class NodesSystemCacheService {
    constructor(private readonly rawCacheService: RawCacheService) {}

    async getMany(nodes: { uuid: string }[]): Promise<Map<string, INodeHotCache>> {
        const pipe = this.rawCacheService.createPipeline();
        for (const node of nodes) {
            pipe.get(CACHE_KEYS.NODE_SYSTEM_INFO(node.uuid));
            pipe.get(CACHE_KEYS.NODE_SYSTEM_STATS(node.uuid));
            pipe.get(CACHE_KEYS.NODE_USERS_ONLINE(node.uuid));
            pipe.get(CACHE_KEYS.NODE_VERSIONS(node.uuid));
            pipe.get(CACHE_KEYS.NODE_XRAY_UPTIME(node.uuid));
        }

        const results = await pipe.exec();
        const map = new Map<string, INodeHotCache>();

        const KEYS_PER_NODE = 5;

        if (!results) {
            for (const node of nodes) {
                map.set(node.uuid, {
                    system: null,
                    versions: null,
                    xrayUptime: 0,
                    onlineUsers: 0,
                });
            }
            return map;
        }

        for (let i = 0; i < nodes.length; i++) {
            const base = i * KEYS_PER_NODE;
            const [infoErr, rawInfo] = results[base];
            const [statsErr, rawStats] = results[base + 1];
            const [onlineErr, rawOnline] = results[base + 2];
            const [versionsErr, rawVersions] = results[base + 3];
            const [uptimeErr, rawUptime] = results[base + 4];

            const system =
                !infoErr && !statsErr && rawInfo && rawStats
                    ? {
                          info: JSON.parse(rawInfo as string),
                          stats: JSON.parse(rawStats as string),
                      }
                    : null;

            const versions = !versionsErr && rawVersions ? JSON.parse(rawVersions as string) : null;
            const xrayUptime = !uptimeErr && rawUptime ? Number(rawUptime) : 0;
            const onlineUsers = !onlineErr && rawOnline ? Number(rawOnline) : 0;

            map.set(nodes[i].uuid, { system, versions, xrayUptime, onlineUsers });
        }

        return map;
    }

    async getOne(uuid: string): Promise<INodeHotCache> {
        const [info, stats, versions, xrayUptime, onlineUsers] = await Promise.all([
            this.rawCacheService.get<INodeSystem['info']>(CACHE_KEYS.NODE_SYSTEM_INFO(uuid)),
            this.rawCacheService.get<INodeSystem['stats']>(CACHE_KEYS.NODE_SYSTEM_STATS(uuid)),
            this.rawCacheService.get<INodeVersions>(CACHE_KEYS.NODE_VERSIONS(uuid)),
            this.rawCacheService.getNumber(CACHE_KEYS.NODE_XRAY_UPTIME(uuid)),
            this.rawCacheService.getNumber(CACHE_KEYS.NODE_USERS_ONLINE(uuid)),
        ]);

        let system: INodeSystem | null = null;
        if (info && stats) {
            system = {
                info: info,
                stats: stats,
            };
        }

        return { system, versions, xrayUptime, onlineUsers };
    }

    async delete(uuid: string): Promise<void> {
        await this.rawCacheService.delMany([
            CACHE_KEYS.NODE_SYSTEM_INFO(uuid),
            CACHE_KEYS.NODE_SYSTEM_STATS(uuid),
            CACHE_KEYS.NODE_USERS_ONLINE(uuid),
            CACHE_KEYS.NODE_VERSIONS(uuid),
            CACHE_KEYS.NODE_XRAY_UPTIME(uuid),
        ]);
    }

    async getTotalOnlineUsers(nodes: { uuid: string }[]): Promise<number> {
        const pipe = this.rawCacheService.createPipeline();
        for (const node of nodes) {
            pipe.get(CACHE_KEYS.NODE_USERS_ONLINE(node.uuid));
        }

        const results = await pipe.exec();
        if (!results) return 0;

        return results.reduce((sum, [err, raw]) => sum + (!err && raw ? Number(raw) : 0), 0);
    }
}
