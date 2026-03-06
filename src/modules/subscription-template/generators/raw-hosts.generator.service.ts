import { Injectable, Logger } from '@nestjs/common';

import { IFormattedHost } from './interfaces/formatted-hosts.interface';
import { IRawHost } from './interfaces';

@Injectable()
export class RawHostsGeneratorService {
    private readonly logger = new Logger(RawHostsGeneratorService.name);

    constructor() {}

    public async generateConfig(hosts: IFormattedHost[]): Promise<IRawHost[]> {
        const rawHosts: IRawHost[] = [];
        try {
            for (const host of hosts) {
                if (!host) {
                    continue;
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { serviceInfo, ...hostData } = host;

                const rawHost: IRawHost = {
                    ...hostData,
                };

                if (host.protocol === 'shadowsocks' && host.shadowsocksOptions) {
                    rawHost.protocolOptions = {
                        ss: {
                            method: host.shadowsocksOptions.method,
                        },
                    };
                }

                rawHosts.push(rawHost);
            }
        } catch (error) {
            this.logger.error('Error generating raw-hosts config:', error);
            return [];
        }

        return rawHosts;
    }
}
