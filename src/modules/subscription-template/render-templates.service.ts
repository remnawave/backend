import { Injectable } from '@nestjs/common';

import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { UserEntity } from '@modules/users/entities';

import { XrayJsonGeneratorService } from './generators/xray-json.generator.service';
import { RawHostsGeneratorService } from './generators/raw-hosts.generator.service';
import { OutlineGeneratorService } from './generators/outline.generator.service';
import { SingBoxGeneratorService } from './generators/singbox.generator.service';
import { MihomoGeneratorService } from './generators/mihomo.generator.service';
import { ClashGeneratorService } from './generators/clash.generator.service';
import { XrayGeneratorService } from './generators/xray.generator.service';
import { FormatHostsService } from './generators/format-hosts.service';
import { SUBSCRIPTION_CONFIG_TYPES } from './constants/config-types';
import { isJsonSubscriptionFallbackSupported } from './constants';
import { IGenerateSubscription } from './interfaces';
import { IRawHost } from './generators/interfaces';

@Injectable()
export class RenderTemplatesService {
    constructor(
        private readonly formatHostsService: FormatHostsService,
        private readonly mihomoGeneratorService: MihomoGeneratorService,
        private readonly clashGeneratorService: ClashGeneratorService,
        private readonly outlineGeneratorService: OutlineGeneratorService,
        private readonly xrayGeneratorService: XrayGeneratorService,
        private readonly singBoxGeneratorService: SingBoxGeneratorService,
        private readonly xrayJsonGeneratorService: XrayJsonGeneratorService,
        private readonly rawHostsGeneratorService: RawHostsGeneratorService,
    ) {}

    public async generateSubscription(params: IGenerateSubscription): Promise<{
        contentType: string;
        subscription: string;
    }> {
        const { srrContext, user, hosts } = params;

        const configParams = SUBSCRIPTION_CONFIG_TYPES[srrContext.matchedResponseType];
        const formattedHosts = await this.formatHostsService.generateFormattedHosts(hosts, user);

        switch (srrContext.matchedResponseType) {
            case 'XRAY_BASE64':
                if (srrContext.subscriptionSettings.serveJsonAtBaseSubscription) {
                    if (isJsonSubscriptionFallbackSupported(srrContext.userAgent)) {
                        return {
                            subscription: await this.xrayJsonGeneratorService.generateConfig(
                                formattedHosts,
                                srrContext.isXrayExtSupported,
                            ),
                            contentType: configParams.CONTENT_TYPE,
                        };
                    }
                }

                return {
                    subscription: await this.xrayGeneratorService.generateConfig(
                        formattedHosts,
                        configParams.isBase64,
                        srrContext.isXrayExtSupported,
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'CLASH':
                return {
                    subscription: await this.clashGeneratorService.generateConfig(
                        formattedHosts,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'MIHOMO':
                return {
                    subscription: await this.mihomoGeneratorService.generateConfig(
                        formattedHosts,
                        false,
                        srrContext.isMihomoExtSupported,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'SINGBOX':
                return {
                    subscription: await this.singBoxGeneratorService.generateConfig(
                        formattedHosts,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'STASH':
                return {
                    subscription: await this.mihomoGeneratorService.generateConfig(
                        formattedHosts,
                        true,
                        false,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'XRAY_JSON':
                return {
                    subscription: await this.xrayJsonGeneratorService.generateConfig(
                        formattedHosts,
                        srrContext.isXrayExtSupported,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            default:
                return { subscription: '', contentType: '' };
        }
    }

    public async generateRawSubscription(params: {
        user: UserEntity;
        hosts: HostWithRawInbound[];
    }): Promise<{
        rawHosts: IRawHost[];
    }> {
        const { user, hosts } = params;

        const formattedHosts = await this.formatHostsService.generateFormattedHosts(
            hosts,
            user,
            true,
        );

        const rawHosts = await this.rawHostsGeneratorService.generateConfig(formattedHosts);

        return {
            rawHosts,
        };
    }

    public async generateOutlineSubscription(
        encodedTag: string,
        user: UserEntity,
        hosts: HostWithRawInbound[],
    ): Promise<{
        contentType: string;
        subscription: string;
    }> {
        const formattedHosts = await this.formatHostsService.generateFormattedHosts(hosts, user);

        return {
            subscription: this.outlineGeneratorService.generateConfig(formattedHosts, encodedTag),
            contentType: 'application/json',
        };
    }
}
