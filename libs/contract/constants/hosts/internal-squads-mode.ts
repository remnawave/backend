export const INTERNAL_SQUADS_MODE = {
    EXCLUDE: 'EXCLUDE',
    ALLOW_ONLY: 'ALLOW_ONLY',
} as const;
export type TInternalSquadsMode = (typeof INTERNAL_SQUADS_MODE)[keyof typeof INTERNAL_SQUADS_MODE];
export const INTERNAL_SQUADS_MODE_VALUES = Object.values(INTERNAL_SQUADS_MODE);
