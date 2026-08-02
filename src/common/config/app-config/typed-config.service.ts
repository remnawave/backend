import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigSchema } from '@common/config/app-config';

type BooleanConfigKey = {
    [K in keyof ConfigSchema]-?: ConfigSchema[K] extends boolean ? K : never;
}[keyof ConfigSchema];

@Injectable()
export class TypedConfigService {
    constructor(private readonly config: ConfigService<ConfigSchema, true>) {}

    get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
        return this.config.get(key, { infer: true }) as ConfigSchema[K];
    }

    getOrThrow<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
        return this.config.getOrThrow(key, { infer: true }) as ConfigSchema[K];
    }

    getIfEnabled<K extends keyof ConfigSchema>(
        enabledKey: BooleanConfigKey,
        key: K,
    ): NonNullable<ConfigSchema[K]> | null {
        if (!this.get(enabledKey)) {
            return null;
        }

        return this.get(key) ?? null;
    }
}
