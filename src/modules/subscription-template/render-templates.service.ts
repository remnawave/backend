import semver from 'semver';

import { Injectable } from '@nestjs/common';

import { HostWithRawInbound } from '@modules/hosts/entities/host-with-inbound-tag.entity';
import { parseSingBoxVersion } from '@modules/subscription/utils/parse-sing-box-version';
import { UserEntity } from '@modules/users/entities';

import { SUBSCRIPTION_CONFIG_TYPES, TSubscriptionConfigTypes } from './constants/config-types';
import { IGenerateSubscription, IGenerateSubscriptionByClientType } from './interfaces';
import { XrayJsonGeneratorService } from './generators/xray-json.generator.service';
import { RawHostsGeneratorService } from './generators/raw-hosts.generator.service';
import { OutlineGeneratorService } from './generators/outline.generator.service';
import { SingBoxGeneratorService } from './generators/singbox.generator.service';
import { MihomoGeneratorService } from './generators/mihomo.generator.service';
import { ClashGeneratorService } from './generators/clash.generator.service';
import { XrayGeneratorService } from './generators/xray.generator.service';
import { FormatHostsService } from './generators/format-hosts.service';
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
        sub: string;
    }> {
        const { userAgent, user, hosts, isOutlineConfig, encodedTag } = params;

        const configType =
            params.needJsonSubscription && this.isJsonSubscriptionAllowed(userAgent)
                ? 'XRAY_JSON'
                : this.parseUserAgentType(userAgent);

        const configParams = SUBSCRIPTION_CONFIG_TYPES[configType];
        const formattedHosts = await this.formatHostsService.generateFormattedHosts(hosts, user);

        if (isOutlineConfig) {
            return {
                contentType: 'application/json',
                sub: this.outlineGeneratorService.generateConfig(formattedHosts, encodedTag),
            };
        }

        switch (configType) {
            case 'XRAY':
                return {
                    sub: await this.xrayGeneratorService.generateConfig(
                        formattedHosts,
                        configParams.BASE64,
                        /^Happ\//.test(userAgent),
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'CLASH':
                return {
                    sub: await this.clashGeneratorService.generateConfig(formattedHosts, false),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'MIHOMO':
                return {
                    sub: await this.mihomoGeneratorService.generateConfig(formattedHosts, false),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'SING_BOX':
                return {
                    sub: await this.singBoxGeneratorService.generateConfig(
                        formattedHosts,
                        parseSingBoxVersion(userAgent),
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'STASH':
                return {
                    sub: await this.mihomoGeneratorService.generateConfig(formattedHosts, true),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'OUTLINE':
                return {
                    sub: this.outlineGeneratorService.generateConfig(formattedHosts),
                    contentType: configParams.CONTENT_TYPE,
                };

            case 'XRAY_JSON':
                return {
                    sub: await this.xrayJsonGeneratorService.generateConfig(
                        formattedHosts,
                        /^Happ\//.test(userAgent),
                    ),
                    contentType: configParams.CONTENT_TYPE,
                };

            default:
                return { sub: '', contentType: '' };
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

    public async generateSubscriptionByClientType(
        params: IGenerateSubscriptionByClientType,
    ): Promise<{
        contentType: string;
        sub: string;
    }> {
        const { userAgent, user, hosts, clientType } = params;

        const formattedHosts = await this.formatHostsService.generateFormattedHosts(hosts, user);

        switch (clientType) {
            case 'MIHOMO':
                return {
                    sub: await this.mihomoGeneratorService.generateConfig(formattedHosts, false),
                    contentType: SUBSCRIPTION_CONFIG_TYPES.MIHOMO.CONTENT_TYPE,
                };

            case 'SINGBOX':
                return {
                    sub: await this.singBoxGeneratorService.generateConfig(
                        formattedHosts,
                        '1.12.0',
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES.SING_BOX.CONTENT_TYPE,
                };
            case 'SINGBOX_LEGACY':
                return {
                    sub: await this.singBoxGeneratorService.generateConfig(
                        formattedHosts,
                        '1.11.1',
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES.SING_BOX.CONTENT_TYPE,
                };

            case 'STASH':
                return {
                    sub: await this.mihomoGeneratorService.generateConfig(formattedHosts, true),
                    contentType: SUBSCRIPTION_CONFIG_TYPES.STASH.CONTENT_TYPE,
                };

            case 'XRAY_JSON':
                return {
                    sub: await this.xrayJsonGeneratorService.generateConfig(
                        formattedHosts,
                        /^Happ\//.test(userAgent),
                    ),
                    contentType: SUBSCRIPTION_CONFIG_TYPES.XRAY_JSON.CONTENT_TYPE,
                };

            case 'CLASH':
                return {
                    sub: await this.clashGeneratorService.generateConfig(formattedHosts, false),
                    contentType: SUBSCRIPTION_CONFIG_TYPES.CLASH.CONTENT_TYPE,
                };

            default:
                return { sub: '', contentType: '' };
        }
    }

    private parseUserAgentType(userAgent: string): TSubscriptionConfigTypes {
        if (!userAgent) return 'XRAY';

        return (
            (Object.entries(SUBSCRIPTION_CONFIG_TYPES).find(
                ([configName, config]: [
                    string,
                    (typeof SUBSCRIPTION_CONFIG_TYPES)[keyof typeof SUBSCRIPTION_CONFIG_TYPES],
                ]) => configName !== 'XRAY' && config.REGEX?.test(userAgent),
            )?.[0] as TSubscriptionConfigTypes) || 'XRAY'
        );
    }

    private isJsonSubscriptionAllowed(userAgent: string): boolean {
        if (!userAgent) return false;

        const xrayJsonClients = [
            /^[Ss]treisand/,
            /^Happ\//,
            /^ktor-client/,
            /^V2Box/,
            /^io\.github\.saeeddev94\.xray\//,
        ];

        if (xrayJsonClients.some((regex) => regex.test(userAgent))) {
            return true;
        }

        const v2rayNGMatch = userAgent.match(/^v2rayNG\/(\d+\.\d+\.\d+)/);
        if (
            v2rayNGMatch &&
            semver.valid(v2rayNGMatch[1]) &&
            semver.gte(v2rayNGMatch[1], '1.8.29')
        ) {
            return true;
        }

        const v2rayNMatch = userAgent.match(/^v2rayN\/(\d+\.\d+\.\d+)/);
        if (v2rayNMatch && semver.gte(v2rayNMatch[1], '6.40.0')) {
            return true;
        }

        return false;
    }
}
