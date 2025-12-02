export interface MetricValue {
    value: string;
    labels: {
        node_uuid: string;
        node_name: string;
        node_country_emoji: string;
        tag: string;
        provider_name: string;
        tags: string;
    };
}

export interface Metric {
    name: string;
    help: string;
    type: string;
    metrics: MetricValue[];
}

export interface InboundStats {
    tag: string;
    upload: string;
    download: string;
}

export interface OutboundStats {
    tag: string;
    upload: string;
    download: string;
}

export interface NodeMetrics {
    nodeUuid: string;
    nodeName: string;
    countryEmoji: string;
    providerName: string;
    usersOnline: number;
    inboundsStats: InboundStats[];
    outboundsStats: OutboundStats[];
}
