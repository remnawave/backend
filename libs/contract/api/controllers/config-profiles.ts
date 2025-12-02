export const CONFIG_PROFILES_CONTROLLER = 'config-profiles' as const;

const ACTIONS_ROUTE = 'actions' as const;

export const CONFIG_PROFILES_ROUTES = {
    GET: '', // Get list of all config profiles // get
    CREATE: '', // Create new config profile // post
    UPDATE: '', // Update config profile by uuid // patch
    GET_BY_UUID: (uuid: string) => `${uuid}`, // Get config profile by uuid // get
    DELETE: (uuid: string) => `${uuid}`, // Delete config profile by uuid // delete
    GET_INBOUNDS_BY_PROFILE_UUID: (uuid: string) => `${uuid}/inbounds`, // Get list of all inbounds by config profile uuid // get
    GET_COMPUTED_CONFIG_BY_PROFILE_UUID: (uuid: string) => `${uuid}/computed-config`, // Get computed config by config profile uuid // get
    GET_ALL_INBOUNDS: 'inbounds', // Get list of all inbounds // get

    ACTIONS: {
        REORDER: `${ACTIONS_ROUTE}/reorder`,
    },
} as const;
