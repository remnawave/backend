export const EXAMPLE_NODE_PLUGIN_CONFIG = {
    sharedLists: [],
    torrentBlocker: {
        enabled: false,
        blockDuration: 3600,
        ignoreLists: {
            ip: [],
        },
    },
    blacklist: {
        enabled: false,
        ip: [],
    },
    connectionDrop: {
        enabled: false,
        whitelistIps: [],
    },
};
