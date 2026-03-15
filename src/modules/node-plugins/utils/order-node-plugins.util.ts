import { TNodePlugin } from 'libs/node-plugins';

export const orderNodePluginsConfig = (config: TNodePlugin) => {
    const { sharedLists, blacklist, torrentBlocker, connectionDrop, egressFilter, ...rest } =
        config;

    return {
        blacklist,
        torrentBlocker,
        connectionDrop,
        egressFilter,
        sharedLists,
        ...rest,
    };
};
