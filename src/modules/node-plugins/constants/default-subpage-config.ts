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
        blockDuration: 3600,
        ignoreLists: {
            ip: [],
            userId: [],
        },
        rulePlacement: 0,
    },
    connectionDrop: {
        enabled: false,
        whitelistIps: [],
    },
    preStart: {
        enabled: false,
        cleanupSockets: {
            enabled: false,
            files: [],
        },
    },
};
