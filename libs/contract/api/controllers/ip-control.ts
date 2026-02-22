export const IP_CONTROL_CONTROLLER = 'ip-control' as const;

export const IP_CONTROL_ROUTES = {
    // POST /ip-control/fetch-ips/:userUuid
    FETCH_IPS: (uuid: string) => `fetch-ips/${uuid}`,
    // GET /ip-control/fetch-ips/result/:jobId
    GET_FETCH_IPS_RESULT: (jobId: string) => `fetch-ips/result/${jobId}`,
    // POST /ip-control/drop-connections
    DROP_CONNECTIONS: 'drop-connections',
} as const;
