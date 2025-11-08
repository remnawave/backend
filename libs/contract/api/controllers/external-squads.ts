export const EXTERNAL_SQUADS_CONTROLLER = 'external-squads' as const;

const BULK_ACTIONS_ROUTE = 'bulk-actions' as const;

export const EXTERNAL_SQUADS_ROUTES = {
    GET: '', // Get list of all external squads // get
    CREATE: '', // Create new external squad // post
    UPDATE: '', // Update external squad by uuid // patch
    GET_BY_UUID: (uuid: string) => `${uuid}`, // Get external squad by uuid // get
    DELETE: (uuid: string) => `${uuid}`, // Delete external squad by uuid // delete

    BULK_ACTIONS: {
        ADD_USERS: (uuid: string) => `${uuid}/${BULK_ACTIONS_ROUTE}/add-users`, // Add users to external squad // post
        REMOVE_USERS: (uuid: string) => `${uuid}/${BULK_ACTIONS_ROUTE}/remove-users`, // Remove users from external squad // delete
    },
} as const;
