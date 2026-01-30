export const CRUD_ACTIONS = {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    DELETED: 'DELETED',
} as const;

export type TCrudActions = [keyof typeof CRUD_ACTIONS][number];
export type TCrudActionsKeys = (typeof CRUD_ACTIONS)[keyof typeof CRUD_ACTIONS];
export const CRUD_ACTIONS_VALUES = Object.values(CRUD_ACTIONS);
