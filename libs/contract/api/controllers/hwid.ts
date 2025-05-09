export const HWID_CONTROLLER = 'hwid' as const;

export const HWID_ROUTES = {
    CREATE_USER_HWID_DEVICE: 'devices',
    GET_USER_HWID_DEVICES: (userUuid: string) => `devices/${userUuid}`,
    DELETE_USER_HWID_DEVICE: 'devices/delete',
} as const;
