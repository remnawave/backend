export const NODE_INTEGRATIONS_CONTROLLER = 'node-integrations' as const;

export const NODE_INTEGRATIONS_ROUTES = {
    GET_ALL: '', // get
    GET: (uuid: string) => `${uuid}`, // get
    UPDATE: '', // patch
    DELETE: (uuid: string) => `${uuid}`, // delete
    CREATE: '', // post
} as const;
