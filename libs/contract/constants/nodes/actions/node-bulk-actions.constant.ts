export const NODES_BULK_ACTIONS = {
    ENABLE: 'ENABLE',
    DISABLE: 'DISABLE',
    RESTART: 'RESTART',
    RESET_TRAFFIC: 'RESET_TRAFFIC',
} as const;

export type TNodesBulkActions = [keyof typeof NODES_BULK_ACTIONS][number];
export const NODES_BULK_ACTIONS_VALUES = Object.values(NODES_BULK_ACTIONS);
export const NODES_BULK_ACTIONS_KEYS = Object.keys(NODES_BULK_ACTIONS) as TNodesBulkActions[];
