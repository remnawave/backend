export const EXAMPLE_NODE_PLUGIN_CONFIG = {
    ingressFilter: {
        enabled: false,
        blockedIps: [],
    },
    egressFilter: {
        enabled: false,
        blockedIps: [],
        blockedPorts: [],
    },
    torrentBlocker: {
        enabled: false,
        webhookUrl: "https://example.com/webhook",
        ignoreLists: {
            ip: [],
            userId: [],
        },
        blockDuration: 3600,
        rulePlacement: 0,
        includeRuleTags: ["change_me"],
    },
    connectionDrop: {
        enabled: false,
        whitelistIps: [],
    },
    preStart: {
        enabled: false,
        cleanupSockets: {
            files: [],
            enabled: false,
        },
    },
    postStart: {
        enabled: false,
        webhook: {
            url: "https://example.com/webhook",
            enabled: false,
        },
    }
};
