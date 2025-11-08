import { Injectable, Logger } from '@nestjs/common';

import { IFormattedHost } from './interfaces';

interface OutlineOutbound {
    method: string;
    password: string;
    server: string;
    server_port: number;
}

@Injectable()
export class OutlineGeneratorService {
    private readonly logger = new Logger(OutlineGeneratorService.name);

    generateConfig(hosts: IFormattedHost[], encodedTag: string): string {
        try {
            const decodedTag = Buffer.from(encodedTag, 'base64').toString('utf-8');

            const config: OutlineOutbound = {} as OutlineOutbound;

            for (const host of hosts) {
                if (!host || host.protocol !== 'shadowsocks') {
                    continue;
                }

                const outbound = this.makeOutbound(
                    host.address,
                    host.port,
                    host.password.ssPassword,
                    'chacha20-ietf-poly1305',
                );

                if (!decodedTag) {
                    Object.assign(config, outbound);
                    break;
                }

                if (decodedTag && decodedTag === host.remark) {
                    Object.assign(config, outbound);
                    break;
                }
            }

            return this.render(config);
        } catch (error) {
            this.logger.error('Error generating outline config:', error);
            return '';
        }
    }

    private render(config: OutlineOutbound): string {
        return JSON.stringify(config, null, 0);
    }

    private makeOutbound(
        server: string,
        server_port: number,
        password: string,
        method: string,
    ): OutlineOutbound {
        return {
            method,
            password,
            server,
            server_port,
        };
    }
}
