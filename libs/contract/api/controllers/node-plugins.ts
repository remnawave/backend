export const NODE_PLUGINS_CONTROLLER = 'node-plugins' as const;

const ACTIONS_ROUTE = 'actions' as const;
const TORRENT_BLOCKER_ROUTE = 'torrent-blocker' as const;
const ABUSE_BLOCKER_ROUTE = 'abuse-blocker' as const;

export const NODE_PLUGINS_ROUTES = {
    GET_ALL: '', // get
    GET: (uuid: string) => `${uuid}`, // get
    UPDATE: '', // patch
    DELETE: (uuid: string) => `${uuid}`, // delete
    CREATE: '', // post,

    ACTIONS: {
        REORDER: `${ACTIONS_ROUTE}/reorder`,
        CLONE: `${ACTIONS_ROUTE}/clone`,
    },

    EXECUTOR: 'executor',

    TORRENT_BLOCKER: {
        GET_REPORTS: `${TORRENT_BLOCKER_ROUTE}`,
        GET_REPORTS_STATS: `${TORRENT_BLOCKER_ROUTE}/stats`,
        TRUNCATE_REPORTS: `${TORRENT_BLOCKER_ROUTE}/truncate`,
    },
    ABUSE_BLOCKER: {
        GET_REPORTS: `${ABUSE_BLOCKER_ROUTE}`,
        GET_REPORTS_STATS: `${ABUSE_BLOCKER_ROUTE}/stats`,
        GET_REVIEW_QUEUE: `${ABUSE_BLOCKER_ROUTE}/review`,
        REVIEW: `${ABUSE_BLOCKER_ROUTE}/review/:userUuid`,
        TRUNCATE_REPORTS: `${ABUSE_BLOCKER_ROUTE}/truncate`,
    },
} as const;
