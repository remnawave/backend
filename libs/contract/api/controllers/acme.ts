export const ACME_CONTROLLER = 'acme' as const;

const CREDENTIALS_ROUTE = 'credentials' as const;
const CERTIFICATES_ROUTE = 'certificates' as const;

export const ACME_ROUTES = {
    CREDENTIALS: {
        GET_ALL: `${CREDENTIALS_ROUTE}`, // get
        CREATE: `${CREDENTIALS_ROUTE}`, // post
        UPDATE: `${CREDENTIALS_ROUTE}`, // patch
        DELETE: (uuid: string) => `${CREDENTIALS_ROUTE}/${uuid}`, // delete
        TEST: (uuid: string) => `${CREDENTIALS_ROUTE}/${uuid}/test`, // post
    },

    CERTIFICATES: {
        GET_ALL: `${CERTIFICATES_ROUTE}`, // get
        GET: (uuid: string) => `${CERTIFICATES_ROUTE}/${uuid}`, // get
        CREATE: `${CERTIFICATES_ROUTE}`, // post
        UPDATE: `${CERTIFICATES_ROUTE}`, // patch
        DELETE: (uuid: string) => `${CERTIFICATES_ROUTE}/${uuid}`, // delete
        ISSUE: (uuid: string) => `${CERTIFICATES_ROUTE}/${uuid}/issue`, // post
        IMPORT: `${CERTIFICATES_ROUTE}/import`, // post
        REIMPORT: (uuid: string) => `${CERTIFICATES_ROUTE}/${uuid}/import`, // post
        EVENTS: (uuid: string) => `${CERTIFICATES_ROUTE}/${uuid}/events`, // get
        PERSIST_RECORD: (uuid: string) => `${CERTIFICATES_ROUTE}/${uuid}/persist-record`, // get
        PUBLISH_PERSIST_RECORD: (uuid: string) =>
            `${CERTIFICATES_ROUTE}/${uuid}/persist-record/publish`, // post
    },
} as const;
