import { VLessSettings } from '@common/helpers/xray-config/interfaces/protocol-settings.config';
import { InboundObject } from '@common/helpers/xray-config/interfaces/protocols.config';

import { ConfigProfileInboundEntity } from '@modules/config-profiles/entities';

interface VlessSettingsWithFlow {
    settings: {
        flow: 'xtls-rprx-vision' | '' | 'none';
    };
}

export const hasVlessSettingsWithFlow = (obj: unknown): obj is VlessSettingsWithFlow => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'settings' in obj &&
        typeof (obj as VlessSettingsWithFlow).settings === 'object' &&
        (obj as VlessSettingsWithFlow).settings !== null &&
        'flow' in (obj as VlessSettingsWithFlow).settings &&
        typeof (obj as VlessSettingsWithFlow).settings.flow === 'string'
    );
};

export const getVlessFlow = (inbound: InboundObject): 'xtls-rprx-vision' | '' | undefined => {
    if (inbound.protocol !== 'vless') {
        return undefined;
    }

    if ((inbound.settings as VLessSettings).flow !== undefined) {
        if ((inbound.settings as VLessSettings).flow === 'xtls-rprx-vision') {
            return 'xtls-rprx-vision';
        } else {
            return '';
        }
    }

    if (inbound.streamSettings) {
        if (
            ['reality', 'tls'].includes(inbound.streamSettings.security || '') &&
            ['raw', 'tcp'].includes(inbound.streamSettings.network)
        ) {
            return 'xtls-rprx-vision';
        }
    }

    return '';
};

export function getVlessFlowFromDbInbound(
    inbound: ConfigProfileInboundEntity,
): 'xtls-rprx-vision' | '' {
    if (inbound.type === 'vless') {
        if (inbound.rawInbound && hasVlessSettingsWithFlow(inbound.rawInbound)) {
            if (inbound.rawInbound.settings.flow === 'xtls-rprx-vision') {
                return 'xtls-rprx-vision';
            } else {
                return '';
            }
        }
    }

    if (
        (inbound.network === 'tcp' || inbound.network === 'raw') &&
        (inbound.security === 'reality' || inbound.security === 'tls')
    ) {
        return 'xtls-rprx-vision';
    }

    return '';
}
