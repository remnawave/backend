import { CACHE_KEYS } from '@contract/constants';

import { Injectable } from '@nestjs/common';

import { RawCacheService } from '@common/raw-cache';

import { INodeSystem } from './interfaces';

@Injectable()
export class NodesSystemCacheService {
    constructor(private readonly rawCacheService: RawCacheService) {}

    async getMany(nodes: { uuid: string }[]): Promise<Map<string, INodeSystem | null>> {
        const pipe = this.rawCacheService.createPipeline();
        for (const node of nodes) {
            pipe.get(CACHE_KEYS.NODE_SYSTEM_INFO(node.uuid));
            pipe.get(CACHE_KEYS.NODE_SYSTEM_STATS(node.uuid));
        }

        const results = await pipe.exec();
        const map = new Map<string, INodeSystem | null>();

        if (!results) {
            for (const node of nodes) {
                map.set(node.uuid, null);
            }
            return map;
        }

        for (let i = 0; i < nodes.length; i++) {
            const [infoErr, rawInfo] = results[i * 2];
            const [hotErr, rawHot] = results[i * 2 + 1];

            map.set(
                nodes[i].uuid,
                !infoErr && !hotErr && rawInfo && rawHot
                    ? { info: JSON.parse(rawInfo as string), stats: JSON.parse(rawHot as string) }
                    : null,
            );
        }

        return map;
    }

    async getOne(uuid: string): Promise<INodeSystem | null> {
        const [rawInfo, rawHot] = await Promise.all([
            this.rawCacheService.get<INodeSystem['info']>(CACHE_KEYS.NODE_SYSTEM_INFO(uuid)),
            this.rawCacheService.get<INodeSystem['stats']>(CACHE_KEYS.NODE_SYSTEM_STATS(uuid)),
        ]);

        if (!rawInfo || !rawHot) return null;

        return { info: rawInfo, stats: rawHot };
    }

    async delete(uuid: string): Promise<void> {
        await this.rawCacheService.del(CACHE_KEYS.NODE_SYSTEM_INFO(uuid));
        await this.rawCacheService.del(CACHE_KEYS.NODE_SYSTEM_STATS(uuid));
    }
}
