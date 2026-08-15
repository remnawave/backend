import { TNodePlugin } from 'libs/node-plugins';

export const orderNodePluginsConfig = (config: TNodePlugin) => {
    const configWithAbuse = config as TNodePlugin & { abuseBlocker?: unknown };
    const {
        sharedLists,
        ingressFilter,
        torrentBlocker,
        abuseBlocker,
        connectionDrop,
        egressFilter,
        ...rest
    } = configWithAbuse;

    return {
        ingressFilter,
        egressFilter,
        torrentBlocker,
        abuseBlocker,
        connectionDrop,
        sharedLists,
        ...rest,
    };
};
