export const IP_CONTROL_CONTROLLER = 'ip-control' as const;

export const IP_CONTROL_ROUTES = {
    // POST /ip-control/fetch-ips/:userUuid
    FETCH_IPS: (uuid: string) => `fetch-ips/${uuid}`,
    // GET /ip-control/fetch-ips/result/:jobId
    GET_FETCH_IPS_RESULT: (jobId: string) => `fetch-ips/result/${jobId}`,
    // POST /ip-control/drop-connections
    DROP_CONNECTIONS: 'drop-connections',
    // POST /ip-control/fetch-users-ips/:nodeUuid
    FETCH_USERS_IPS: (nodeUuid: string) => `fetch-users-ips/${nodeUuid}`,
    // GET /ip-control/fetch-users-ips/result/:jobId
    GET_FETCH_USERS_IPS_RESULT: (jobId: string) => `fetch-users-ips/result/${jobId}`,
} as const;
