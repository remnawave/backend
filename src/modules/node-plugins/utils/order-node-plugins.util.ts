import { TNodePlugin } from 'libs/node-plugins';

export const orderNodePluginsConfig = (config: TNodePlugin) => {
    const { sharedLists, ingressFilter, torrentBlocker, connectionDrop, egressFilter, ...rest } =
        config;

    return {
        ingressFilter,
        egressFilter,
        torrentBlocker,
        connectionDrop,
        sharedLists,
        ...rest,
    };
};
