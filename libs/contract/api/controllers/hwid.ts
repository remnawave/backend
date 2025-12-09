export const HWID_CONTROLLER = 'hwid' as const;

export const HWID_ROUTES = {
    GET_ALL_HWID_DEVICES: 'devices', // get
    CREATE_USER_HWID_DEVICE: 'devices',
    GET_USER_HWID_DEVICES: (userUuid: string) => `devices/${userUuid}`,
    DELETE_USER_HWID_DEVICE: 'devices/delete',
    DELETE_ALL_USER_HWID_DEVICES: 'devices/delete-all',

    STATS: 'devices/stats', // get
    TOP_USERS_BY_DEVICES: 'devices/top-users', // get
} as const;
