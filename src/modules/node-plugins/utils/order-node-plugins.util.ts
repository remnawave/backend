import { TNodePlugin } from 'libs/node-plugins';

export const orderNodePluginsConfig = (config: TNodePlugin) => {
    const { sharedLists, blacklist, torrentBlocker, connectionDrop, ...rest } = config;

    return {
        blacklist,
        torrentBlocker,
        connectionDrop,
        sharedLists,
        ...rest,
    };
};
