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
        CLONE: `${HOST_ACTIONS_ROUTE}/clone`,
    },

    BULK: {
        ENABLE_HOSTS: 'bulk/enable',
        DISABLE_HOSTS: 'bulk/disable',
        DELETE_HOSTS: 'bulk/delete',
        UPDATE: 'bulk/update',
    },

    TAGS: {
        GET: 'tags',
    },
} as const;
