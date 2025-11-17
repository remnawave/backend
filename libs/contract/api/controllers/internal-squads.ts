export const INTERNAL_SQUADS_CONTROLLER = 'internal-squads' as const;

const BULK_ACTIONS_ROUTE = 'bulk-actions' as const;
const ACTIONS_ROUTE = 'actions' as const;

export const INTERNAL_SQUADS_ROUTES = {
    GET: '', // Get list of all internal squads // get
    CREATE: '', // Create new internal squad // post
    UPDATE: '', // Update internal squad by uuid // patch
    GET_BY_UUID: (uuid: string) => `${uuid}`, // Get internal squad by uuid // get
    DELETE: (uuid: string) => `${uuid}`, // Delete internal squad by uuid // delete
    ACCESSIBLE_NODES: (uuid: string) => `${uuid}/accessible-nodes`, // Get accessible nodes for internal squad // get

    BULK_ACTIONS: {
        ADD_USERS: (uuid: string) => `${uuid}/${BULK_ACTIONS_ROUTE}/add-users`, // Add users to internal squad // post
        REMOVE_USERS: (uuid: string) => `${uuid}/${BULK_ACTIONS_ROUTE}/remove-users`, // Remove users from internal squad // delete
    },
    ACTIONS: {
        REORDER: `${ACTIONS_ROUTE}/reorder`,
    },
} as const;
