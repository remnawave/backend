export const HOSTS_CONTROLLER = 'hosts' as const;

export const HOST_ACTIONS_ROUTE = 'actions' as const;

export const HOSTS_ROUTES = {
    CREATE: '', // create
    UPDATE: '', // update host
    GET: '', // get all hosts
    GET_BY_UUID: (uuid: string) => `${uuid}`, // get by UUID
    DELETE: (uuid: string) => `${uuid}`, // delete by UUID

    ACTIONS: {
        REORDER: `${HOST_ACTIONS_ROUTE}/reorder`,
    },

    BULK: {
        ENABLE_HOSTS: 'bulk/enable',
        DISABLE_HOSTS: 'bulk/disable',
        DELETE_HOSTS: 'bulk/delete',
        SET_INBOUND: 'bulk/set-inbound',
        SET_PORT: 'bulk/set-port',
    },
} as const;
