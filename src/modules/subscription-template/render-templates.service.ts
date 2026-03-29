import { Injectable } from '@nestjs/common';

import { SubscriptionSettingsEntity } from '@modules/subscription-settings/entities/subscription-settings.entity';
import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { ExternalSquadEntity } from '@modules/external-squads/entities';
import { UserEntity } from '@modules/users/entities';

import { ResolveProxyConfigService } from './resolve-proxy/resolve-proxy-config.service';
import { XrayJsonGeneratorService } from './generators/xray-json.generator.service';
import { SingBoxGeneratorService } from './generators/singbox.generator.service';
import { MihomoGeneratorService } from './generators/mihomo.generator.service';
import { ClashGeneratorService } from './generators/clash.generator.service';
import { XrayGeneratorService } from './generators/xray.generator.service';
import { SUBSCRIPTION_CONFIG_TYPES } from './constants/config-types';
import { ResolvedProxyConfig } from './resolve-proxy/interfaces';
import { IGenerateSubscription } from './interfaces';

@Injectable()
export class RenderTemplatesService {
    constructor(
        private readonly resolveProxyConfigService: ResolveProxyConfigService,
        private readonly mihomoGeneratorService: MihomoGeneratorService,
        private readonly clashGeneratorService: ClashGeneratorService,
        private readonly xrayGeneratorService: XrayGeneratorService,
        private readonly singBoxGeneratorService: SingBoxGeneratorService,
        private readonly xrayJsonGeneratorService: XrayJsonGeneratorService,
    ) {}

    public async generateSubscription(params: IGenerateSubscription): Promise<{
        contentType: string;
        subscription: string;
    }> {
        const { srrContext, user, hosts, hostsOverrides, fallbackOptions } = params;

        const formattedHosts = await this.resolveProxyConfigService.resolveProxyConfig({
            subscriptionSettings: srrContext.subscriptionSettings,
            hosts,
            user,
            hostsOverrides,
            fallbackOptions,
        });

        switch (srrContext.matchedResponseType) {
            case 'XRAY_BASE64':
                return {
                    subscription: await this.xrayGeneratorService.generateConfig(
                        formattedHosts,
                        SUBSCRIPTION_CONFIG_TYPES['XRAY_BASE64'].isBase64,
                        srrContext.isExtendedClient,
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES['XRAY_BASE64'].CONTENT_TYPE,
                };

            case 'CLASH':
                return {
                    subscription: await this.clashGeneratorService.generateConfig(
                        formattedHosts,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES['CLASH'].CONTENT_TYPE,
                };

            case 'MIHOMO':
                return {
                    subscription: await this.mihomoGeneratorService.generateConfig(
                        formattedHosts,
                        false,
                        srrContext.isExtendedClient,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES['MIHOMO'].CONTENT_TYPE,
                };

            case 'SINGBOX':
                return {
                    subscription: await this.singBoxGeneratorService.generateConfig(
                        formattedHosts,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES['SINGBOX'].CONTENT_TYPE,
                };

            case 'STASH':
                return {
                    subscription: await this.mihomoGeneratorService.generateConfig(
                        formattedHosts,
                        true,
                        false,
                        srrContext.overrideTemplateName,
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES['STASH'].CONTENT_TYPE,
                };

            case 'XRAY_JSON':
                return {
                    subscription: await this.xrayJsonGeneratorService.generateConfig({
                        hosts: formattedHosts,
                        isExtendedClient: srrContext.isExtendedClient,
                        overrideTemplateName: srrContext.overrideTemplateName,
                        ignoreHostXrayJsonTemplate: srrContext.ignoreHostXrayJsonTemplate,
                    }),
                    contentType: SUBSCRIPTION_CONFIG_TYPES['XRAY_JSON'].CONTENT_TYPE,
                };

            default:
                return { subscription: '', contentType: '' };
        }
    }

    public async generateRawSubscription(params: {
        user: UserEntity;
        hosts: HostWithRawInbound[];
        hostsOverrides: ExternalSquadEntity['hostOverrides'] | undefined;
        subscriptionSettings: SubscriptionSettingsEntity;
    }): Promise<ResolvedProxyConfig[]> {
        const { user, hosts, hostsOverrides, subscriptionSettings } = params;

        return await this.resolveProxyConfigService.resolveProxyConfig({
            subscriptionSettings,
            hosts,
            user,
            hostsOverrides,
        });
    }
}
