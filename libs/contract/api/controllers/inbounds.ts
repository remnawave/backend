export const INBOUNDS_CONTROLLER = 'inbounds' as const;

export const INBOUNDS_ROUTES = {
    GET_INBOUNDS: '',
    GET_FULL_INBOUNDS: 'full',

    BULK: {
        ADD_INBOUND_TO_USERS: 'bulk/add-to-users',
        REMOVE_INBOUND_FROM_USERS: 'bulk/remove-from-users',
        ADD_INBOUND_TO_NODES: 'bulk/add-to-nodes',
        REMOVE_INBOUND_FROM_NODES: 'bulk/remove-from-nodes',
    },
} as const;
