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
        },
    },
    connectionDrop: {
        enabled: false,
        whitelistIps: [],
    },
    sharedLists: [],
};
